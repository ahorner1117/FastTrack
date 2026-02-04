import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ImagePlus, X, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { useFeedStore } from '@/src/stores/feedStore';
import { useVehicleStore } from '@/src/stores/vehicleStore';
import type { Vehicle } from '@/src/types';

export default function CreatePostScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const { createNewPost } = useFeedStore();
  const vehicles = useVehicleStore((state) => state.vehicles);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }, []);

  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('Image Required', 'Please select an image for your post.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createNewPost(
        imageUri,
        caption.trim() || undefined,
        selectedVehicle?.id
      );
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create post.');
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
              disabled={!imageUri || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={COLORS.accent} />
              ) : (
                <Text
                  style={[
                    styles.postButton,
                    {
                      color: imageUri ? COLORS.accent : colors.textSecondary,
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
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Image Picker */}
            <Pressable
              style={[styles.imagePicker, { backgroundColor: colors.surface }]}
              onPress={pickImage}
            >
              {imageUri ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.image} />
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={() => setImageUri(null)}
                  >
                    <X color="#FFFFFF" size={18} />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <ImagePlus color={colors.textSecondary} size={48} />
                  <Text
                    style={[
                      styles.imagePlaceholderText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Tap to add photo
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Caption */}
            <TextInput
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
              multiline
              maxLength={500}
            />

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
                      style={styles.vehicleOption}
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
                        style={styles.vehicleOption}
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
          </ScrollView>
        </KeyboardAvoidingView>
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  vehicleOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  vehicleOptionSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
});
