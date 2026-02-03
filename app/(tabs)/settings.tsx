import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Check, LogOut, User } from 'lucide-react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { useAuthStore } from '@/src/stores/authStore';
import { signOut } from '@/src/services/authService';
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

const LAUNCH_THRESHOLD_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: '0.1', label: '0.1G', description: 'Very sensitive - may trigger from phone movement' },
  { value: '0.2', label: '0.2G', description: 'Sensitive - catches gentle starts' },
  { value: '0.3', label: '0.3G', description: 'Balanced - recommended for most uses' },
  { value: '0.4', label: '0.4G', description: 'Moderate - requires firmer acceleration' },
  { value: '0.5', label: '0.5G', description: 'Less sensitive - for sporty launches' },
];

const LAUNCH_SAMPLE_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: '1', label: '1 sample', description: 'Instant detection (10ms)' },
  { value: '2', label: '2 samples', description: 'Quick detection (20ms) - filters brief bumps' },
  { value: '3', label: '3 samples', description: 'Stable detection (30ms) - filters hand movement' },
  { value: '4', label: '4 samples', description: 'Very stable (40ms) - most resistant to false triggers' },
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

  const { user, profile } = useAuthStore();

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

        <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut}>
          <LogOut color={colors.error} size={20} />
          <Text style={[styles.signOutText, { color: colors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </Card>

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
});
