import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Check } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { Toggle } from '@/src/components/common/Toggle';
import { Card } from '@/src/components/common/Card';
import type { UnitSystem, Appearance, GPSAccuracy } from '@/src/types';

const APPEARANCE_OPTIONS: { value: Appearance; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const GPS_ACCURACY_OPTIONS: { value: GPSAccuracy; label: string; description: string }[] = [
  { value: 'high', label: 'High', description: '5m accuracy required' },
  { value: 'medium', label: 'Medium', description: '10m accuracy required' },
  { value: 'low', label: 'Low', description: '20m accuracy required' },
];

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  isDark: boolean;
}

function SettingRow({ label, description, children, isDark }: SettingRowProps) {
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLabelContainer}>
        <Text style={[styles.settingLabel, { color: colors.text }]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isDark: boolean;
}

function SegmentedControl({
  options,
  selectedValue,
  onSelect,
  isDark,
}: SegmentedControlProps) {
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View
      style={[
        styles.segmentedControl,
        { backgroundColor: isDark ? '#1A1A1A' : '#E5E5E5' },
      ]}
    >
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.segmentedOption,
              isSelected && {
                backgroundColor: colors.tint,
              },
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text
              style={[
                styles.segmentedOptionText,
                { color: isSelected ? '#000000' : colors.textSecondary },
                isSelected && styles.segmentedOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface DropdownProps {
  options: { value: string; label: string; description?: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isDark: boolean;
}

function Dropdown({ options, selectedValue, onSelect, isDark }: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const colors = Colors[isDark ? 'dark' : 'light'];
  const selectedOption = options.find((o) => o.value === selectedValue);

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          { backgroundColor: isDark ? '#1A1A1A' : '#E5E5E5' },
        ]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[styles.dropdownButtonText, { color: colors.text }]}>
          {selectedOption?.label}
        </Text>
        <ChevronDown
          color={colors.textSecondary}
          size={18}
          style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>

      {isOpen && (
        <View
          style={[
            styles.dropdownMenu,
            {
              backgroundColor: isDark ? '#262626' : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          {options.map((option) => {
            const isSelected = option.value === selectedValue;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownOption,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
              >
                <View style={styles.dropdownOptionContent}>
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      { color: colors.text },
                      isSelected && { color: colors.tint },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.description && (
                    <Text
                      style={[
                        styles.dropdownOptionDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {option.description}
                    </Text>
                  )}
                </View>
                {isSelected && <Check color={colors.tint} size={18} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const {
    unitSystem,
    appearance,
    gpsAccuracy,
    hapticFeedback,
    autoSaveRuns,
    setUnitSystem,
    setAppearance,
    setGpsAccuracy,
    setHapticFeedback,
    setAutoSaveRuns,
  } = useSettingsStore();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        UNITS
      </Text>
      <Card isDark={isDark}>
        <SettingRow label="Unit System" isDark={isDark}>
          <SegmentedControl
            options={[
              { value: 'imperial', label: 'Imperial' },
              { value: 'metric', label: 'Metric' },
            ]}
            selectedValue={unitSystem}
            onSelect={(value) => setUnitSystem(value as UnitSystem)}
            isDark={isDark}
          />
        </SettingRow>
      </Card>

      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        APPEARANCE
      </Text>
      <Card isDark={isDark}>
        <SettingRow label="Theme" isDark={isDark}>
          <SegmentedControl
            options={APPEARANCE_OPTIONS}
            selectedValue={appearance}
            onSelect={(value) => setAppearance(value as Appearance)}
            isDark={isDark}
          />
        </SettingRow>
      </Card>

      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        GPS
      </Text>
      <Card isDark={isDark}>
        <SettingRow
          label="Accuracy Threshold"
          description="Minimum GPS accuracy required for timing"
          isDark={isDark}
        >
          <Dropdown
            options={GPS_ACCURACY_OPTIONS}
            selectedValue={gpsAccuracy}
            onSelect={(value) => setGpsAccuracy(value as GPSAccuracy)}
            isDark={isDark}
          />
        </SettingRow>
      </Card>

      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        PREFERENCES
      </Text>
      <Card isDark={isDark}>
        <SettingRow
          label="Haptic Feedback"
          description="Vibrate on milestones and events"
          isDark={isDark}
        >
          <Toggle
            value={hapticFeedback}
            onValueChange={setHapticFeedback}
            isDark={isDark}
          />
        </SettingRow>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <SettingRow
          label="Auto-Save Runs"
          description="Automatically save completed runs"
          isDark={isDark}
        >
          <Toggle
            value={autoSaveRuns}
            onValueChange={setAutoSaveRuns}
            isDark={isDark}
          />
        </SettingRow>
      </Card>

      <Text style={[styles.versionText, { color: colors.textSecondary }]}>
        FastTrack v1.0.0
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segmentedOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  segmentedOptionText: {
    fontSize: 14,
  },
  segmentedOptionTextSelected: {
    fontWeight: '600',
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  dropdownButtonText: {
    fontSize: 14,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 180,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  dropdownOptionContent: {
    flex: 1,
  },
  dropdownOptionText: {
    fontSize: 14,
  },
  dropdownOptionDescription: {
    fontSize: 11,
    marginTop: 2,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 32,
  },
});
