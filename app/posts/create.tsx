import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { ImagePlus, X, ChevronDown, MapPin } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { useFeedStore } from '@/src/stores/feedStore';
import { useVehicleStore } from '@/src/stores/vehicleStore';
import { useHistoryStore } from '@/src/stores/historyStore';
import { useDriveHistoryStore } from '@/src/stores/driveHistoryStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { VisibilityToggle } from '@/src/components/Feed/VisibilityToggle';
import { MentionTextInput } from '@/src/components/common/MentionTextInput';
import { formatTime, formatSpeedWithUnit } from '@/src/utils/formatting';
import type { Vehicle, PostVisibility } from '@/src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CreatePostScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const { runId, driveId, vehicleId: paramVehicleId } = useLocalSearchParams<{
    runId?: string;
    driveId?: string;
    vehicleId?: string;
  }>();

  const { createNewPost } = useFeedStore();
  const vehicles = useVehicleStore((state) => state.vehicles);
  const getRunById = useHistoryStore((state) => state.getRunById);
  const getDriveById = useDriveHistoryStore((state) => state.getDriveById);
  const unitSystem = useSettingsStore((state) => state.unitSystem);

  const [imageUris, setImageUris] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<Array<{ place_id: string; description: string }>>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Pre-select vehicle from params
  useEffect(() => {
    if (paramVehicleId) {
      const vehicle = vehicles.find((v) => v.id === paramVehicleId);
      if (vehicle) setSelectedVehicle(vehicle);
    }
  }, [paramVehicleId, vehicles]);

  // Get run/drive data for preview
  const run = runId ? getRunById(runId) : null;
  const drive = driveId ? getDriveById(driveId) : null;

  const pickImage = useCallback(async () => {
    if (imageUris.length >= 7) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUris((prev) => [...prev, result.assets[0].uri]);
    }
  }, [imageUris.length]);

  const searchPlaces = useCallback(async (query: string) => {
    if (query.length < 2) {
      setLocationResults([]);
      return;
    }
    setIsSearchingLocation(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        setIsSearchingLocation(false);
        return;
      }
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${apiKey}`
      );
      const data = await response.json();
      if (data.predictions) {
        setLocationResults(
          data.predictions.map((p: any) => ({
            place_id: p.place_id,
            description: p.description,
          }))
        );
      }
    } catch (error) {
      console.error('Places search error:', error);
    } finally {
      setIsSearchingLocation(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationQuery) searchPlaces(locationQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [locationQuery, searchPlaces]);

  const handleSubmit = async () => {
    if (imageUris.length === 0) {
      Alert.alert('Image Required', 'Please select at least one image for your post.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createNewPost(
        imageUris,
        caption.trim() || undefined,
        selectedVehicle?.id,
        runId || undefined,
        driveId || undefined,
        visibility,
        locationName || undefined
      );
      Toast.show({
        type: 'success',
        text1: 'Post shared successfully',
        visibilityTime: 2000,
      });
      setTimeout(() => router.back(), 300);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to create post',
        text2: error.message || 'Something went wrong',
        visibilityTime: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectVehicle = (vehicle: Vehicle | null) => {
    setSelectedVehicle(vehicle);
    setShowVehiclePicker(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'New Post',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <Pressable
              onPress={handleSubmit}
              disabled={imageUris.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <Text
                  style={[
                    styles.postButton,
                    {
                      color: imageUris.length > 0 ? COLORS.accent : colors.textSecondary,
                    },
                  ]}
                >
                  Post
                </Text>
              )}
            </Pressable>
          ),
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <KeyboardAwareScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          enableOnAndroid
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
            {/* Image Picker */}
            {imageUris.length > 0 ? (
              <View style={styles.imageStripContainer}>
                <View style={styles.imageStrip}>
                  {imageUris.map((uri, index) => (
                    <View key={uri} style={styles.imageStripItem}>
                      <Image source={{ uri }} style={styles.imageStripImage} />
                      <Pressable
                        style={styles.removeImageButton}
                        onPress={() =>
                          setImageUris((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        <X color="#FFFFFF" size={14} />
                      </Pressable>
                    </View>
                  ))}
                  {imageUris.length < 7 && (
                    <Pressable
                      style={[styles.addMoreButton, { backgroundColor: colors.surface }]}
                      onPress={pickImage}
                    >
                      <ImagePlus color={colors.textSecondary} size={24} />
                    </Pressable>
                  )}
                </View>
                <Text style={[styles.imageCount, { color: colors.textSecondary }]}>
                  {imageUris.length}/7 photos
                </Text>
              </View>
            ) : (
              <Pressable
                style={[styles.imagePicker, { backgroundColor: colors.surface }]}
                onPress={pickImage}
              >
                <View style={styles.imagePlaceholder}>
                  <ImagePlus color={colors.textSecondary} size={48} />
                  <Text
                    style={[
                      styles.imagePlaceholderText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Tap to add photos
                  </Text>
                </View>
              </Pressable>
            )}

            {/* Caption */}
            <MentionTextInput
              style={[
                styles.captionInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
              placeholder="Write a caption..."
              placeholderTextColor={colors.textSecondary}
              value={caption}
              onChangeText={setCaption}
              isDark={isDark}
              multiline
              maxLength={500}
            />

            {/* Visibility Toggle */}
            <VisibilityToggle
              visibility={visibility}
              onVisibilityChange={setVisibility}
              isDark={isDark}
            />

            {/* Location Picker */}
            <View style={[styles.locationButton, { backgroundColor: colors.surface }]}>
              <Pressable
                style={styles.locationButtonTouchable}
                onPress={() => setShowLocationPicker(!showLocationPicker)}
              >
                <MapPin color={locationName ? COLORS.accent : colors.textSecondary} size={20} />
                <Text
                  style={[
                    styles.locationButtonText,
                    { color: locationName ? colors.text : colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {locationName || 'Add Location'}
                </Text>
              </Pressable>
              {locationName && (
                <Pressable
                  onPress={() => {
                    setLocationName(null);
                    setShowLocationPicker(false);
                    setLocationQuery('');
                    setLocationResults([]);
                  }}
                  hitSlop={8}
                >
                  <X color={colors.textSecondary} size={18} />
                </Pressable>
              )}
            </View>

            {showLocationPicker && (
              <View style={[styles.locationPicker, { backgroundColor: colors.surface }]}>
                <View style={[styles.locationSearchContainer, { backgroundColor: colors.background }]}>
                  <TextInput
                    style={[styles.locationSearchInput, { color: colors.text }]}
                    placeholder="Search for a city..."
                    placeholderTextColor={colors.textSecondary}
                    value={locationQuery}
                    onChangeText={setLocationQuery}
                    autoFocus
                  />
                </View>
                {isSearchingLocation && (
                  <ActivityIndicator size="small" color={COLORS.accent} style={{ marginVertical: 8 }} />
                )}
                {locationResults.map((result) => (
                  <Pressable
                    key={result.place_id}
                    style={[styles.locationOption, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                    onPress={() => {
                      setLocationName(result.description);
                      setShowLocationPicker(false);
                      setLocationQuery('');
                      setLocationResults([]);
                    }}
                  >
                    <MapPin color={colors.textSecondary} size={16} />
                    <Text style={[styles.locationOptionText, { color: colors.text }]} numberOfLines={1}>
                      {result.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Run/Drive Preview */}
            {run && (
              <View
                style={[
                  styles.attachmentPreview,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.attachmentLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Sharing Run
                </Text>
                {run.milestones.zeroToSixty && (
                  <Text style={[styles.attachmentStat, { color: colors.text }]}>
                    0-60: {formatTime(run.milestones.zeroToSixty.time)}
                  </Text>
                )}
                {run.milestones.quarterMile && (
                  <Text style={[styles.attachmentStat, { color: colors.text }]}>
                    1/4 Mile: {formatTime(run.milestones.quarterMile.time)}
                  </Text>
                )}
              </View>
            )}

            {drive && (
              <View
                style={[
                  styles.attachmentPreview,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.attachmentLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Sharing Drive
                </Text>
                <Text style={[styles.attachmentStat, { color: colors.text }]}>
                  Max Speed: {formatSpeedWithUnit(drive.maxSpeed, unitSystem)}
                </Text>
              </View>
            )}

            {/* Vehicle Selector */}
            {vehicles.length > 0 && (
              <View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Tag a vehicle (optional)
                </Text>
                <Pressable
                  style={[
                    styles.vehicleSelector,
                    { backgroundColor: colors.surface },
                  ]}
                  onPress={() => setShowVehiclePicker(!showVehiclePicker)}
                >
                  <Text
                    style={[
                      styles.vehicleSelectorText,
                      {
                        color: selectedVehicle
                          ? colors.text
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {selectedVehicle?.name || 'Select vehicle'}
                  </Text>
                  <ChevronDown color={colors.textSecondary} size={20} />
                </Pressable>

                {showVehiclePicker && (
                  <View
                    style={[
                      styles.vehicleList,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Pressable
                      style={[styles.vehicleOption, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                      onPress={() => selectVehicle(null)}
                    >
                      <Text
                        style={[
                          styles.vehicleOptionText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        None
                      </Text>
                    </Pressable>
                    {vehicles.map((vehicle) => (
                      <Pressable
                        key={vehicle.id}
                        style={[styles.vehicleOption, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                        onPress={() => selectVehicle(vehicle)}
                      >
                        <Text
                          style={[
                            styles.vehicleOptionText,
                            { color: colors.text },
                          ]}
                        >
                          {vehicle.name}
                        </Text>
                        <Text
                          style={[
                            styles.vehicleOptionSubtext,
                            { color: colors.textSecondary },
                          ]}
                        >
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  imagePicker: {
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  imagePlaceholderText: {
    fontSize: 16,
  },
  captionInput: {
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  attachmentPreview: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  attachmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  attachmentStat: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  vehicleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
  },
  vehicleSelectorText: {
    fontSize: 15,
  },
  vehicleList: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  vehicleOption: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  vehicleOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  vehicleOptionSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  locationButtonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  locationButtonText: {
    flex: 1,
    fontSize: 15,
  },
  locationPicker: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  locationSearchContainer: {
    padding: 10,
  },
  locationSearchInput: {
    fontSize: 15,
    padding: 10,
    borderRadius: 8,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  locationOptionText: {
    flex: 1,
    fontSize: 14,
  },
  imageStripContainer: {
    marginBottom: 16,
  },
  imageStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageStripItem: {
    width: (SCREEN_WIDTH - 32 - 16) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imageStripImage: {
    width: '100%',
    height: '100%',
  },
  addMoreButton: {
    width: (SCREEN_WIDTH - 32 - 16) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCount: {
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
});
