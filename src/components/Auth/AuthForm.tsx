import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/src/utils/constants';
import { PasswordInput } from './PasswordInput';

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up';
  email: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
  username?: string;
  usernameError?: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange?: (password: string) => void;
  onDisplayNameChange?: (name: string) => void;
  onUsernameChange?: (username: string) => void;
  onSubmit: () => void;
  onSwitchMode: () => void;
  onForgotPassword?: () => void;
  isLoading: boolean;
  isDark: boolean;
}

export function AuthForm({
  mode,
  email,
  password,
  confirmPassword,
  displayName,
  username,
  usernameError,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onDisplayNameChange,
  onUsernameChange,
  onSubmit,
  onSwitchMode,
  onForgotPassword,
  isLoading,
  isDark,
}: AuthFormProps) {
  const colors = isDark ? COLORS.dark : COLORS.light;
  const isSignUp = mode === 'sign-up';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {isSignUp
                ? 'Sign up to track and share your runs'
                : 'Sign in to continue'}
            </Text>
          </View>

          <View style={styles.form}>
            {isSignUp && onDisplayNameChange && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Display Name (optional)
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Your name"
                  placeholderTextColor={colors.textSecondary}
                  value={displayName}
                  onChangeText={onDisplayNameChange}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            )}

            {isSignUp && onUsernameChange && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Username
                </Text>
                <View style={styles.usernameInputRow}>
                  <Text style={[styles.usernamePrefix, { color: colors.textSecondary }]}>
                    @
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.usernameInput,
                      {
                        backgroundColor: colors.surface,
                        borderColor: usernameError ? COLORS.dark.error : colors.border,
                        color: colors.text,
                      },
                    ]}
                    placeholder="username"
                    placeholderTextColor={colors.textSecondary}
                    value={username}
                    onChangeText={onUsernameChange}
                    autoCapitalize="none"
                    autoCorrect={false}
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
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Email
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={onEmailChange}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                Password
              </Text>
              <PasswordInput
                placeholder="Enter password"
                value={password}
                onChangeText={onPasswordChange}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType={isSignUp ? 'newPassword' : 'password'}
                isDark={isDark}
              />
            </View>

            {!isSignUp && onForgotPassword && (
              <TouchableOpacity onPress={onForgotPassword} style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: COLORS.accent }]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            )}

            {isSignUp && onConfirmPasswordChange && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Confirm Password
                </Text>
                <PasswordInput
                  placeholder="Enter password again"
                  value={confirmPassword}
                  onChangeText={onConfirmPasswordChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  isDark={isDark}
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: COLORS.accent },
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={onSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {isSignUp
                ? 'Already have an account?'
                : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={onSwitchMode}>
              <Text style={[styles.linkText, { color: COLORS.accent }]}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
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
  usernameInput: {
    flex: 1,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
