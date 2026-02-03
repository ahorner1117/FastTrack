import { useRouter } from 'expo-router';
import { Check, ChevronDown, ChevronRight, LogOut, Phone, Shield, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
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
import { signOut, updateProfile, getProfile } from '@/src/services/authService';
import { hashPhoneNumber } from '@/src/services/contactsService';
import { useAuthStore } from '@/src/stores/authStore';
import { useSettingsStore } from '@/src/stores/settingsStore';
import type { Appearance, GPSAccuracy, UnitSystem } from '@/src/types';
import { COLORS } from '@/src/utils/constants';

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
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const handleSavePhoneNumber = async () => {
    if (!user || !phoneNumber.trim()) return;

    setIsSavingPhone(true);
    try {
      const phone_hash = await hashPhoneNumber(phoneNumber);
      await updateProfile(user.id, { phone_hash });
      const updatedProfile = await getProfile(user.id);
      setProfile(updatedProfile);
      setPhoneNumber('');
      Alert.alert('Success', 'Phone number saved. Friends can now find you by your number.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save phone number');
    } finally {
      setIsSavingPhone(false);
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
          <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
            <User color="#000000" size={24} />
          </View>
          <View style={styles.accountInfo}>
            <Text style={[styles.accountName, { color: colors.text }]}>
              {profile?.display_name || 'FastTrack User'}
            </Text>
            <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
              {user?.email}
            </Text>
          </View>
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
                Registered
              </Text>
            )}
          </View>
          <Text style={[styles.phoneDescription, { color: colors.textSecondary }]}>
            Add your phone so friends can find you from their contacts
          </Text>
          <View style={styles.phoneInputRow}>
            <TextInput
              style={[
                styles.phoneInput,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#E5E5E5',
                  color: colors.text,
                },
              ]}
              placeholder={profile?.phone_hash ? 'Update phone number' : 'Enter phone number'}
              placeholderTextColor={colors.textSecondary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoComplete="tel"
            />
            <TouchableOpacity
              style={[
                styles.phoneSaveButton,
                { opacity: phoneNumber.trim() && !isSavingPhone ? 1 : 0.5 },
              ]}
              onPress={handleSavePhoneNumber}
              disabled={!phoneNumber.trim() || isSavingPhone}
            >
              <Text style={styles.phoneSaveText}>
                {isSavingPhone ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
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
});
