import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { AtSign, Camera, Check, ChevronDown, ChevronRight, LogOut, Pencil, Phone, Shield, Trash2, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Card } from '@/src/components/common/Card';
import { Toggle } from '@/src/components/common/Toggle';
import { checkUsernameAvailable, deleteAccount, getProfile, signOut, updateProfile } from '@/src/services/authService';
import { deleteAvatar, uploadAvatar } from '@/src/services/avatarService';
import { supabase } from '@/src/lib/supabase';
import { useAuthStore } from '@/src/stores/authStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import type { Appearance, GPSAccuracy, UnitSystem } from '@/src/types';
import { COLORS } from '@/src/utils/constants';
import { isReservedUsername } from '@/src/utils/usernameValidation';

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

const LAUNCH_THRESHOLD_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: '0.2', label: '0.2G', description: 'Sensitive - catches gentle starts' },
  { value: '0.3', label: '0.3G', description: 'Balanced - recommended for most uses' },
  { value: '0.4', label: '0.4G', description: 'Moderate - requires firmer acceleration' },
  { value: '0.5', label: '0.5G', description: 'Less sensitive - for sporty launches' },
  { value: '0.6', label: '0.6G', description: 'Low sensitivity - filters most hand motion' },
  { value: '0.7', label: '0.7G', description: 'Very low - requires strong acceleration' },
];

const LAUNCH_SAMPLE_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: '2', label: '2 samples', description: 'Quick detection (20ms) - filters brief bumps' },
  { value: '3', label: '3 samples', description: 'Stable detection (30ms) - filters hand movement' },
  { value: '4', label: '4 samples', description: 'Very stable (40ms) - resistant to false triggers' },
  { value: '5', label: '5 samples', description: 'Extra stable (50ms) - high resistance' },
  { value: '6', label: '6 samples', description: 'Maximum stability (60ms) - most resistant' },
];

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  isDark: boolean;
  zIndex?: number;
}

function SettingRow({ label, description, children, isDark, zIndex }: SettingRowProps) {
  const colors = Colors[isDark ? 'dark' : 'light'];

  return (
    <View style={[styles.settingRow, zIndex !== undefined && { zIndex }]}>
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
  zIndex?: number;
}

function Dropdown({ options, selectedValue, onSelect, isDark, zIndex = 1 }: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const colors = Colors[isDark ? 'dark' : 'light'];
  const selectedOption = options.find((o) => o.value === selectedValue);

  return (
    <>
      {isOpen && (
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={() => setIsOpen(false)}
        />
      )}
      <View style={[styles.dropdownContainer, { zIndex: isOpen ? 1000 : zIndex }]}>
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
          <ScrollView
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: isDark ? '#262626' : '#FFFFFF',
                borderColor: colors.border,
                maxHeight: 300,
              },
            ]}
            nestedScrollEnabled
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
          </ScrollView>
        )}
      </View>
    </>
  );
}


export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const router = useRouter();

  const { user, profile, isAdmin, setProfile } = useAuthStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const [verificationRequestId, setVerificationRequestId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(profile?.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  const handlePickAvatar = async () => {
    Alert.alert('Profile Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Camera access is needed to take photos.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            await handleUploadAvatar(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
          });
          if (!result.canceled && result.assets[0]) {
            await handleUploadAvatar(result.assets[0].uri);
          }
        },
      },
      ...(profile?.avatar_url
        ? [
          {
            text: 'Remove Photo',
            style: 'destructive' as const,
            onPress: handleRemoveAvatar,
          },
        ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const handleUploadAvatar = async (uri: string) => {
    if (!user) return;

    setIsUploadingAvatar(true);
    try {
      const { url, error } = await uploadAvatar(uri);
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      if (url) {
        const updatedProfile = await getProfile(user.id);
        setProfile(updatedProfile);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;

    setIsUploadingAvatar(true);
    try {
      const success = await deleteAvatar();
      if (success) {
        const updatedProfile = await getProfile(user.id);
        setProfile(updatedProfile);
      } else {
        Alert.alert('Error', 'Failed to remove photo');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const formatPhoneE164 = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('1') && digits.length === 11) return `+${digits}`;
    if (digits.length === 10) return `+1${digits}`;
    return `+${digits}`;
  };

  const getPhoneValidation = (phone: string): { valid: boolean; message: string | null } => {
    if (!phone.trim()) return { valid: false, message: null };
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('1') && digits.length === 11) return { valid: true, message: `Will send to +${digits}` };
    if (digits.length === 10) return { valid: true, message: `Will send to +1${digits}` };
    if (digits.length < 10) return { valid: false, message: 'Enter a full 10-digit phone number' };
    return { valid: false, message: 'Invalid phone number format' };
  };

  const phoneValidation = getPhoneValidation(phoneNumber);

  const handleSendOtp = async () => {
    if (!phoneNumber.trim() || !phoneValidation.valid) return;

    setIsSendingOtp(true);
    try {
      const e164 = formatPhoneE164(phoneNumber);
      console.log('Sending OTP to:', e164);

      const { data, error } = await supabase.functions.invoke('send-verification', {
        body: { phone: e164 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setVerificationRequestId(data.request_id);
      setOtpSent(true);
    } catch (error: any) {
      console.log('Send OTP error:', error.message);
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!user || !otpCode.trim() || !phoneNumber.trim() || !verificationRequestId) return;

    setIsVerifying(true);
    try {
      const e164 = formatPhoneE164(phoneNumber);
      const { data, error } = await supabase.functions.invoke('check-verification', {
        body: { request_id: verificationRequestId, code: otpCode, phone: e164 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Refresh profile to pick up updated phone_hash
      const updatedProfile = await getProfile(user.id);
      setProfile(updatedProfile);
      setPhoneNumber('');
      setOtpCode('');
      setOtpSent(false);
      setVerificationRequestId(null);
      Alert.alert('Verified', 'Phone number verified. Friends can now find you by your number.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setNewUsername(cleaned);
    if (cleaned.length > 0 && cleaned.length <= 4) {
      setUsernameError('Must be more than 4 characters');
    } else {
      setUsernameError('');
    }
  };

  const handleSaveUsername = async () => {
    if (!user || !newUsername.trim()) return;

    if (newUsername.length <= 4) {
      setUsernameError('Must be more than 4 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setUsernameError('Letters, numbers, and underscores only');
      return;
    }

    if (isReservedUsername(newUsername)) {
      setUsernameError('This username is not available');
      return;
    }

    if (newUsername.toLowerCase() === profile?.username) {
      setIsEditingUsername(false);
      return;
    }

    setIsSavingUsername(true);
    try {
      const available = await checkUsernameAvailable(newUsername, user.id);
      if (!available) {
        setUsernameError('This username is already taken');
        setIsSavingUsername(false);
        return;
      }

      await updateProfile(user.id, { username: newUsername.toLowerCase() });
      const updatedProfile = await getProfile(user.id);
      setProfile(updatedProfile);
      setIsEditingUsername(false);
      setUsernameError('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update username');
    } finally {
      setIsSavingUsername(false);
    }
  };

  const {
    unitSystem,
    appearance,
    gpsAccuracy,
    hapticFeedback,
    autoSaveRuns,
    launchDetectionThresholdG,
    launchDetectionSampleCount,
    setUnitSystem,
    setAppearance,
    setGpsAccuracy,
    setHapticFeedback,
    setAutoSaveRuns,
    setLaunchDetectionThresholdG,
    setLaunchDetectionSampleCount,
  } = useSettingsStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Confirm Deletion',
              'Type DELETE to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async (value?: string) => {
                    if (value !== 'DELETE') {
                      Alert.alert('Error', 'Please type DELETE to confirm.');
                      return;
                    }
                    setIsDeletingAccount(true);
                    try {
                      await deleteAccount();
                    } catch (error: any) {
                      Alert.alert('Error', error.message || 'Failed to delete account');
                      setIsDeletingAccount(false);
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        ACCOUNT
      </Text>
      <Card isDark={isDark}>
        <View style={styles.accountRow}>
          <Pressable onPress={handlePickAvatar} disabled={isUploadingAvatar}>
            <View style={[styles.avatarContainer]}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
                  <User color="#000000" size={24} />
                </View>
              )}
              {isUploadingAvatar ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              ) : (
                <View style={styles.avatarBadge}>
                  <Camera color="#FFFFFF" size={12} />
                </View>
              )}
            </View>
          </Pressable>
          <View style={styles.accountInfo}>
            <Text style={[styles.accountName, { color: colors.text }]}>
              {profile?.display_name || 'FastTrack User'}
            </Text>
            {profile?.username && (
              <Text style={[styles.accountUsername, { color: colors.textSecondary }]}>
                @{profile.username}
              </Text>
            )}
            <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
              {user?.email}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.usernameSection}>
          <View style={styles.usernameLabelRow}>
            <AtSign color={colors.textSecondary} size={18} />
            <Text style={[styles.usernameLabel, { color: colors.text }]}>
              Username
            </Text>
            {!isEditingUsername && (
              <Pressable
                onPress={() => {
                  setNewUsername(profile?.username || '');
                  setIsEditingUsername(true);
                  setUsernameError('');
                }}
              >
                <Pencil color={colors.textSecondary} size={16} />
              </Pressable>
            )}
          </View>
          {isEditingUsername ? (
            <>
              <View style={styles.usernameInputRow}>
                <Text style={[styles.usernameAtSign, { color: colors.textSecondary }]}>@</Text>
                <TextInput
                  style={[
                    styles.usernameInput,
                    {
                      backgroundColor: isDark ? '#1A1A1A' : '#E5E5E5',
                      color: colors.text,
                      borderColor: usernameError ? COLORS.dark.error : 'transparent',
                      borderWidth: usernameError ? 1 : 0,
                    },
                  ]}
                  placeholder="username"
                  placeholderTextColor={colors.textSecondary}
                  value={newUsername}
                  onChangeText={handleUsernameChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
                <TouchableOpacity
                  style={[
                    styles.usernameSaveButton,
                    { opacity: newUsername.length > 4 && !isSavingUsername ? 1 : 0.5 },
                  ]}
                  onPress={handleSaveUsername}
                  disabled={newUsername.length <= 4 || isSavingUsername}
                >
                  <Text style={styles.usernameSaveText}>
                    {isSavingUsername ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
              {usernameError ? (
                <Text style={styles.usernameErrorText}>{usernameError}</Text>
              ) : null}
              <Pressable onPress={() => {
                setIsEditingUsername(false);
                setUsernameError('');
              }}>
                <Text style={[styles.usernameCancelText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
            </>
          ) : (
            <Text style={[styles.usernameDisplay, { color: colors.textSecondary }]}>
              @{profile?.username || 'not set'}
            </Text>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.phoneSection}>
          <View style={styles.phoneLabelRow}>
            <Phone color={colors.textSecondary} size={18} />
            <Text style={[styles.phoneLabel, { color: colors.text }]}>
              Phone Number
            </Text>
            {profile?.phone_hash && (
              <Text style={[styles.phoneStatus, { color: COLORS.accent }]}>
                Verified
              </Text>
            )}
          </View>
          <Text style={[styles.phoneDescription, { color: colors.textSecondary }]}>
            {otpSent
              ? 'Enter the 6-digit code sent to your phone'
              : 'Verify your phone so friends can find you from their contacts'}
          </Text>
          {!otpSent ? (
            <View>
              <View style={styles.phoneInputRow}>
                <TextInput
                  style={[
                    styles.phoneInput,
                    {
                      backgroundColor: isDark ? '#1A1A1A' : '#E5E5E5',
                      color: colors.text,
                    },
                  ]}
                  placeholder={profile?.phone_hash ? 'Update phone number' : '+1 (555) 123-4567'}
                  placeholderTextColor={colors.textSecondary}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
                <TouchableOpacity
                  style={[
                    styles.phoneSaveButton,
                    { opacity: phoneValidation.valid && !isSendingOtp ? 1 : 0.5 },
                  ]}
                  onPress={handleSendOtp}
                  disabled={!phoneValidation.valid || isSendingOtp}
                >
                  <Text style={styles.phoneSaveText}>
                    {isSendingOtp ? 'Sending...' : 'Verify'}
                  </Text>
                </TouchableOpacity>
              </View>
              {phoneValidation.message && (
                <Text style={[
                  styles.phoneHint,
                  { color: phoneValidation.valid ? colors.textSecondary : '#FF6B6B' },
                ]}>
                  {phoneValidation.message}
                </Text>
              )}
            </View>
          ) : (
            <View>
              <View style={styles.phoneInputRow}>
                <TextInput
                  style={[
                    styles.phoneInput,
                    {
                      backgroundColor: isDark ? '#1A1A1A' : '#E5E5E5',
                      color: colors.text,
                      letterSpacing: 8,
                      textAlign: 'center',
                      fontSize: 20,
                      fontWeight: '600',
                    },
                  ]}
                  placeholder="000000"
                  placeholderTextColor={colors.textSecondary}
                  value={otpCode}
                  onChangeText={(text) => setOtpCode(text.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
                <TouchableOpacity
                  style={[
                    styles.phoneSaveButton,
                    { opacity: otpCode.length === 6 && !isVerifying ? 1 : 0.5 },
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={otpCode.length !== 6 || isVerifying}
                >
                  <Text style={styles.phoneSaveText}>
                    {isVerifying ? 'Checking...' : 'Confirm'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.otpCancelRow}
                onPress={() => {
                  setOtpSent(false);
                  setOtpCode('');
                  setVerificationRequestId(null);
                }}
              >
                <Text style={[styles.otpCancelText, { color: colors.textSecondary }]}>
                  Wrong number? Go back
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut}>
          <LogOut color={colors.error} size={20} />
          <Text style={[styles.signOutText, { color: colors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>

      </Card>

      {isAdmin && (
        <>
          <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
            ADMIN
          </Text>
          <Card isDark={isDark}>
            <TouchableOpacity
              style={styles.adminRow}
              onPress={() => router.push('/admin')}
            >
              <Shield color={COLORS.accent} size={20} />
              <Text style={[styles.adminRowText, { color: colors.text }]}>
                Admin Portal
              </Text>
              <ChevronRight color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </Card>
        </>
      )}

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
        LAUNCH DETECTION
      </Text>
      <Card isDark={isDark}>
        <SettingRow
          label="Threshold"
          description="Acceleration force required to start timing"
          isDark={isDark}
          zIndex={2}
        >
          <Dropdown
            options={LAUNCH_THRESHOLD_OPTIONS}
            selectedValue={launchDetectionThresholdG.toString()}
            onSelect={(value) => setLaunchDetectionThresholdG(parseFloat(value))}
            isDark={isDark}
            zIndex={2}
          />
        </SettingRow>

        <View style={[styles.divider, { backgroundColor: colors.border, zIndex: 1 }]} />

        <SettingRow
          label="Sample Count"
          description="Consecutive readings required to confirm launch"
          isDark={isDark}
          zIndex={1}
        >
          <Dropdown
            options={LAUNCH_SAMPLE_OPTIONS}
            selectedValue={launchDetectionSampleCount.toString()}
            onSelect={(value) => setLaunchDetectionSampleCount(parseInt(value, 10))}
            isDark={isDark}
            zIndex={1}
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

      <TouchableOpacity
        style={styles.deleteAccountRow}
        onPress={handleDeleteAccount}
        disabled={isDeletingAccount}
      >
        <Trash2 color={colors.textSecondary} size={16} />
        <Text style={[styles.deleteAccountText, { color: colors.textSecondary }]}>
          {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
        </Text>
        {isDeletingAccount && <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginLeft: 'auto' }} />}
      </TouchableOpacity>

      <Text style={[styles.versionText, { color: colors.textSecondary }]}>
        FastTrack v{Constants.expoConfig?.version ?? '1.2.2'}
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
  dropdownBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
  },
  dropdownContainer: {
    position: 'relative',
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
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 1,
  },
  accountUsername: {
    fontSize: 13,
    marginBottom: 1,
  },
  accountEmail: {
    fontSize: 13,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
  },
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  adminRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  usernameSection: {
    marginVertical: 4,
  },
  usernameLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  usernameLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  usernameDisplay: {
    fontSize: 14,
  },
  usernameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  usernameAtSign: {
    fontSize: 16,
    fontWeight: '500',
  },
  usernameInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  usernameSaveButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    height: 44,
  },
  usernameSaveText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  usernameErrorText: {
    fontSize: 12,
    color: COLORS.dark.error,
    marginTop: 4,
  },
  usernameCancelText: {
    fontSize: 14,
    marginTop: 8,
  },
  phoneSection: {
    marginVertical: 4,
  },
  phoneLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  phoneLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  phoneStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  phoneDescription: {
    fontSize: 12,
    marginBottom: 12,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phoneInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  phoneSaveButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  phoneSaveText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  phoneHint: {
    fontSize: 12,
    marginTop: 6,
  },
  otpCancelRow: {
    marginTop: 12,
    alignItems: 'center',
  },
  otpCancelText: {
    fontSize: 13,
  },
  deleteAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 32,
    paddingVertical: 8,
  },
  deleteAccountText: {
    fontSize: 13,
  },
});
