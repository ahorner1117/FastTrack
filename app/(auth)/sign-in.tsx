import React, { useState } from 'react';
import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthForm } from '@/src/components/Auth';
import { signIn, signInWithGoogle } from '@/src/services/authService';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      await signIn({ email: email.trim(), password });
      // Auth state change will automatically redirect to tabs
    } catch (error: any) {
      Alert.alert(
        'Sign In Failed',
        error.message || 'An error occurred while signing in'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Auth state change will automatically redirect
    } catch (error: any) {
      Alert.alert(
        'Google Sign-In Failed',
        error.message || 'An error occurred during Google sign-in'
      );
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password' as any);
  };

  const handleSwitchMode = () => {
    router.replace('/(auth)/sign-up' as any);
  };

  return (
    <AuthForm
      mode="sign-in"
      email={email}
      password={password}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSignIn}
      onSwitchMode={handleSwitchMode}
      onForgotPassword={handleForgotPassword}
      onGoogleSignIn={handleGoogleSignIn}
      isLoading={isLoading}
      isGoogleLoading={isGoogleLoading}
      isDark={isDark}
    />
  );
}
