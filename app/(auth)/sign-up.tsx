import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthForm } from '@/src/components/Auth';
import { signUp } from '@/src/services/authService';

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await signUp({
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
      });
      Alert.alert(
        'Account Created',
        'Please check your email to verify your account, then sign in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/sign-in' as any),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Sign Up Failed',
        error.message || 'An error occurred while creating your account'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchMode = () => {
    router.replace('/(auth)/sign-in' as any);
  };

  return (
    <AuthForm
      mode="sign-up"
      email={email}
      password={password}
      confirmPassword={confirmPassword}
      displayName={displayName}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onDisplayNameChange={setDisplayName}
      onSubmit={handleSignUp}
      onSwitchMode={handleSwitchMode}
      isLoading={isLoading}
      isDark={isDark}
    />
  );
}
