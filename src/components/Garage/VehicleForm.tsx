import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Camera, X, Check } from 'lucide-react-native';
import type { Vehicle, VehicleUpgrade, VehicleType } from '../../types';
import { COLORS, VEHICLE_TYPES } from '../../utils/constants';
import { VehicleImage } from './VehicleImage';
import { UpgradeSelector } from './UpgradeSelector';
import { AutocompleteInput } from './AutocompleteInput';
import {
  getMakesForType,
  getModelsForMakeId,
  findMakeByName,
  titleCase,
  type VehicleMake,
  type VehicleModel,
} from '../../services/vpicService';

interface VehicleFormData {
  type: VehicleType;
  year: string;
  make: string;
  model: string;
  trim: string;
  photoUri?: string;
  upgrades: VehicleUpgrade[];
  notes: string;
}

interface VehicleFormProps {
  initialData?: Partial<VehicleFormData>;
  onSubmit: (data: VehicleFormData) => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  isDark?: boolean;
  submitLabel?: string;
  isSubmitting?: boolean;
}

export function VehicleForm({
  initialData,
  onSubmit,
  onPickImage,
  onRemoveImage,
  isDark = true,
  submitLabel = 'Save',
  isSubmitting = false,
}: VehicleFormProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [type, setType] = React.useState<VehicleType>(initialData?.type ?? 'car');
  const [year, setYear] = React.useState(initialData?.year ?? '');
  const [make, setMake] = React.useState(initialData?.make ?? '');
  const [model, setModel] = React.useState(initialData?.model ?? '');
  const [trim, setTrim] = React.useState(initialData?.trim ?? '');
  const [photoUri, setPhotoUri] = React.useState(initialData?.photoUri);
  const [upgrades, setUpgrades] = React.useState<VehicleUpgrade[]>(
    initialData?.upgrades ?? []
  );
  const [notes, setNotes] = React.useState(initialData?.notes ?? '');

  const [makes, setMakes] = React.useState<VehicleMake[]>([]);
  const [models, setModels] = React.useState<VehicleModel[]>([]);
  const [makesLoading, setMakesLoading] = React.useState(false);
  const [modelsLoading, setModelsLoading] = React.useState(false);
  const [selectedMakeId, setSelectedMakeId] = React.useState<number | null>(null);

  React.useEffect(() => {
    setPhotoUri(initialData?.photoUri);
  }, [initialData?.photoUri]);

  // Load makes when type changes
  React.useEffect(() => {
    if (type === 'other') {
      setMakes([]);
      setModels([]);
      setSelectedMakeId(null);
      return;
    }
    let cancelled = false;
    setMakesLoading(true);
    getMakesForType(type).then((result) => {
      if (!cancelled) {
        setMakes(result);
        setMakesLoading(false);
        // Try to resolve initial make
        if (make) {
          const found = findMakeByName(result, make);
          if (found) setSelectedMakeId(found.MakeId);
        }
      }
    });
    return () => { cancelled = true; };
  }, [type]);

  // Load models when selectedMakeId changes
  React.useEffect(() => {
    if (!selectedMakeId) {
      setModels([]);
      return;
    }
    let cancelled = false;
    setModelsLoading(true);
    getModelsForMakeId(selectedMakeId).then((result) => {
      if (!cancelled) {
        setModels(result);
        setModelsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedMakeId]);

  const filteredMakes = React.useMemo(() => {
    if (!make || make.length < 2) return [];
    const lower = make.toLowerCase();
    return makes
      .filter((m) => titleCase(m.MakeName).toLowerCase().includes(lower))
      .slice(0, 20)
      .map((m) => titleCase(m.MakeName));
  }, [make, makes]);

  const filteredModels = React.useMemo(() => {
    if (!model || model.length < 2) return [];
    const lower = model.toLowerCase();
    return models
      .filter((m) => titleCase(m.Model_Name).toLowerCase().includes(lower))
      .slice(0, 20)
      .map((m) => titleCase(m.Model_Name));
  }, [model, models]);

  const handleMakeChange = (text: string) => {
    setMake(text);
    // Try to resolve make ID as user types
    const found = findMakeByName(makes, text);
    if (found) {
      setSelectedMakeId(found.MakeId);
    } else {
      setSelectedMakeId(null);
      setModels([]);
    }
  };

  const handleMakeSelect = (selected: string) => {
    setMake(selected);
    setModel('');
    const found = findMakeByName(makes, selected);
    setSelectedMakeId(found?.MakeId ?? null);
  };

  const handleModelSelect = (selected: string) => {
    setModel(selected);
  };

  const handleToggleUpgrade = (upgrade: VehicleUpgrade) => {
    setUpgrades((prev) =>
      prev.includes(upgrade)
        ? prev.filter((u) => u !== upgrade)
        : [...prev, upgrade]
    );
  };

  const handleSubmit = () => {
    if (!year.trim() || !make.trim() || !model.trim()) {
      return;
    }
    onSubmit({
      type,
      year,
      make,
      model,
      trim,
      photoUri,
      upgrades,
      notes,
    });
  };

  const isValid = year.trim() && make.trim() && model.trim();
  const useAutocomplete = type !== 'other';

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={onPickImage} activeOpacity={0.8}>
            <VehicleImage photoUri={photoUri} size={120} isDark={isDark} />
            <View
              style={[
                styles.cameraButton,
                { backgroundColor: colors.surfaceElevated },
              ]}
            >
              <Camera color={colors.text} size={16} />
            </View>
          </TouchableOpacity>
          {photoUri && (
            <TouchableOpacity
              style={[
                styles.removeImageButton,
                { backgroundColor: colors.surfaceElevated },
              ]}
              onPress={onRemoveImage}
            >
              <X color={COLORS.dark.error} size={16} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          VEHICLE TYPE
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.typeSelector}>
            {VEHICLE_TYPES.map((vehicleType) => (
              <TouchableOpacity
                key={vehicleType.value}
                style={[
                  styles.typeOption,
                  {
                    backgroundColor:
                      type === vehicleType.value
                        ? COLORS.accent
                        : colors.surfaceElevated,
                  },
                ]}
                onPress={() => setType(vehicleType.value as VehicleType)}
                activeOpacity={0.8}
              >
                {type === vehicleType.value && (
                  <Check color="#000000" size={16} style={styles.typeCheckIcon} />
                )}
                <Text
                  style={[
                    styles.typeOptionText,
                    {
                      color: type === vehicleType.value ? '#000000' : colors.text,
                    },
                  ]}
                >
                  {vehicleType.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          VEHICLE INFO
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Year</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surfaceElevated, color: colors.text },
              ]}
              value={year}
              onChangeText={setYear}
              placeholder="2024"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={[styles.inputRow, { zIndex: 3 }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Make</Text>
            {useAutocomplete ? (
              <AutocompleteInput
                value={make}
                onChangeText={handleMakeChange}
                onSelect={handleMakeSelect}
                suggestions={filteredMakes}
                placeholder="Ford"
                isDark={isDark}
                loading={makesLoading}
                autoCapitalize="words"
              />
            ) : (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceElevated, color: colors.text },
                ]}
                value={make}
                onChangeText={setMake}
                placeholder="Ford"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
              />
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={[styles.inputRow, { zIndex: 2 }]}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Model</Text>
            {useAutocomplete && selectedMakeId ? (
              <AutocompleteInput
                value={model}
                onChangeText={setModel}
                onSelect={handleModelSelect}
                suggestions={filteredModels}
                placeholder="Mustang"
                isDark={isDark}
                loading={modelsLoading}
                autoCapitalize="words"
              />
            ) : (
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surfaceElevated, color: colors.text },
                ]}
                value={model}
                onChangeText={setModel}
                placeholder="Mustang"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
              />
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Trim</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surfaceElevated, color: colors.text },
              ]}
              value={trim}
              onChangeText={setTrim}
              placeholder="GT, Sport, Limited..."
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
          </View>
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          UPGRADES
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <UpgradeSelector
            selectedUpgrades={upgrades}
            onToggle={handleToggleUpgrade}
            isDark={isDark}
          />
        </View>

        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
          NOTES
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TextInput
            style={[
              styles.notesInput,
              { backgroundColor: colors.surfaceElevated, color: colors.text },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about your vehicle..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor:
                isValid && !isSubmitting ? COLORS.accent : colors.surfaceElevated,
            },
          ]}
          onPress={handleSubmit}
          disabled={!isValid || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text
              style={[
                styles.submitButtonText,
                {
                  color: isValid ? '#000000' : colors.textTertiary,
                },
              ]}
            >
              {submitLabel}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    top: 0,
    right: '50%',
    marginRight: -60,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  typeCheckIcon: {
    marginRight: 6,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  inputLabel: {
    fontSize: 16,
    flex: 1,
  },
  input: {
    flex: 2,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  notesInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 100,
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
