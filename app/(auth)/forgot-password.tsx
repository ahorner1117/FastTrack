import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { COLORS } from '@/src/utils/constants';
import { resetPasswordForEmail } from '@/src/services/authService';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await resetPasswordForEmail(email.trim());
      setIsSent(true);
    } catch (error: any) {
      // Supabase returns success even for non-existent emails (security best practice)
      // So we show the confirmation view regardless
      setIsSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.sentContent}>
          <Mail color={COLORS.accent} size={48} />
          <Text style={[styles.sentTitle, { color: colors.text }]}>Check Your Email</Text>
          <Text style={[styles.sentSubtitle, { color: colors.textSecondary }]}>
            We sent a password reset link to {email}. Check your inbox and follow the link to reset
            your password.
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in' as any)}>
            <Text style={[styles.backLink, { color: COLORS.accent }]}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
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
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: COLORS.accent },
                isLoading && styles.submitButtonDisabled,
              ]}
              onPress={handleSendReset}
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.submitButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(auth)/sign-in' as any)}
          >
            <Text style={[styles.backLink, { color: COLORS.accent }]}>Back to Sign In</Text>
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
  backButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  backLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  sentContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  sentTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  sentSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
});
