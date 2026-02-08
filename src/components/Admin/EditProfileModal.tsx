import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import { X } from 'lucide-react-native';
import type { Profile, UpdateProfileInput } from '@/src/types';
import { COLORS } from '@/src/utils/constants';

interface EditProfileModalProps {
  visible: boolean;
  profile: Profile;
  isDark: boolean;
  onClose: () => void;
  onSave: (updates: UpdateProfileInput) => Promise<void>;
}

export function EditProfileModal({
  visible,
  profile,
  isDark,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [isAdmin, setIsAdmin] = useState(profile.is_admin);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bgColor = isDark ? COLORS.dark.card : '#FFFFFF';
  const textColor = isDark ? COLORS.dark.text : '#000000';
  const secondaryColor = isDark ? COLORS.dark.textSecondary : '#666666';
  const borderColor = isDark ? COLORS.dark.border : '#E0E0E0';
  const inputBg = isDark ? COLORS.dark.background : '#F5F5F5';

  const handleSave = async () => {
    setError(null);

    // Validation
    if (displayName && (displayName.length < 1 || displayName.length > 50)) {
      setError('Display name must be 1-50 characters');
      return;
    }

    if (avatarUrl && avatarUrl.trim() && !isValidUrl(avatarUrl)) {
      setError('Avatar URL must be a valid URL');
      return;
    }

    setIsSaving(true);

    try {
      const updates: UpdateProfileInput = {};
      if (displayName !== profile.display_name) {
        updates.display_name = displayName || null;
      }
      if (avatarUrl !== profile.avatar_url) {
        updates.avatar_url = avatarUrl.trim() || null;
      }
      if (isAdmin !== profile.is_admin) {
        updates.is_admin = isAdmin;
      }

      await onSave(updates);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Text style={[styles.title, { color: textColor }]}>Edit Profile</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: COLORS.error + '20' }]}>
              <Text style={[styles.errorText, { color: COLORS.error }]}>
                {error}
              </Text>
            </View>
          )}

          <Text style={[styles.label, { color: textColor }]}>Display Name</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: inputBg, color: textColor, borderColor },
            ]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter display name"
            placeholderTextColor={secondaryColor}
            maxLength={50}
          />

          <Text style={[styles.label, { color: textColor }]}>Avatar URL</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: inputBg, color: textColor, borderColor },
            ]}
            value={avatarUrl}
            onChangeText={setAvatarUrl}
            placeholder="https://example.com/avatar.jpg"
            placeholderTextColor={secondaryColor}
            keyboardType="url"
            autoCapitalize="none"
          />

          {avatarUrl && isValidUrl(avatarUrl) && (
            <View style={styles.avatarPreview}>
              <Text style={[styles.previewLabel, { color: secondaryColor }]}>
                Preview:
              </Text>
              <Image source={{ uri: avatarUrl }} style={styles.previewImage} />
            </View>
          )}

          <View style={[styles.switchRow, { borderTopColor: borderColor }]}>
            <View style={styles.switchContent}>
              <Text style={[styles.label, { color: textColor, marginBottom: 0 }]}>
                Admin Status
              </Text>
              <Text style={[styles.switchDescription, { color: secondaryColor }]}>
                Grant full admin privileges
              </Text>
            </View>
            <Switch
              value={isAdmin}
              onValueChange={setIsAdmin}
              trackColor={{ false: borderColor, true: COLORS.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor }]}
            onPress={onClose}
            disabled={isSaving}
          >
            <Text style={[styles.buttonText, { color: textColor }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              { backgroundColor: COLORS.accent },
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  avatarPreview: {
    marginTop: 12,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 13,
    marginBottom: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  switchContent: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
