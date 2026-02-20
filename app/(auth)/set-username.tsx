import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { COLORS } from '@/src/utils/constants';
import { useAuthStore } from '@/src/stores/authStore';
import {
  checkUsernameAvailable,
  updateProfile,
  getProfile,
} from '@/src/services/authService';
import { validateUsername } from '@/src/utils/usernameValidation';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export default function SetUsernameScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const router = useRouter();
  const { user, setProfile } = useAuthStore();

  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUsernameChange = useCallback((value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
    if (cleaned.length > 0 && cleaned.length <= 4) {
      setUsernameError('Username must be more than 4 characters');
    } else {
      setUsernameError('');
    }
  }, []);

  const handleSubmit = async () => {
    if (!username.trim()) {
      setUsernameError('Please choose a username');
      return;
    }

    if (username.length <= 4) {
      setUsernameError('Username must be more than 4 characters');
      return;
    }

    if (!USERNAME_REGEX.test(username)) {
      setUsernameError('Letters, numbers, and underscores only');
      return;
    }

    const validation = validateUsername(username);
    if (!validation.allowed) {
      setUsernameError(validation.message);
      return;
    }

    if (!user) return;

    setIsLoading(true);
    try {
      const available = await checkUsernameAvailable(username, user.id);
      if (!available) {
        setUsernameError('This username is already taken');
        setIsLoading(false);
        return;
      }

      await updateProfile(user.id, { username: username.toLowerCase() });
      const updatedProfile = await getProfile(user.id);
      setProfile(updatedProfile);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set username');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Choose a Username
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Pick a unique username so others can find and tag you.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.usernameInputRow}>
              <Text style={[styles.usernamePrefix, { color: colors.textSecondary }]}>
                @
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: usernameError ? COLORS.dark.error : colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="username"
                placeholderTextColor={colors.textSecondary}
                value={username}
                onChangeText={handleUsernameChange}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
            </View>
            {usernameError ? (
              <Text style={styles.usernameError}>{usernameError}</Text>
            ) : (
              <Text style={[styles.usernameHint, { color: colors.textTertiary }]}>
                Must be more than 4 characters. Letters, numbers, and underscores only.
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: COLORS.accent },
              (isLoading || username.length <= 4) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading || username.length <= 4}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.submitButtonText}>Continue</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 24,
  },
  usernameInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernamePrefix: {
    fontSize: 18,
    fontWeight: '500',
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  usernameError: {
    fontSize: 12,
    color: COLORS.dark.error,
    marginLeft: 4,
    marginTop: 2,
  },
  usernameHint: {
    fontSize: 12,
    marginLeft: 4,
    marginTop: 2,
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
