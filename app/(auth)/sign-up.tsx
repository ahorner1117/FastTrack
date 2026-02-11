import React, { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { AuthForm } from '@/src/components/Auth';
import { signUp, checkUsernameAvailable } from '@/src/services/authService';
import { TermsOfServiceModal } from '@/src/components/Auth/TermsOfServiceModal';
import { TOS_VERSION } from '@/src/utils/tosContent';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export default function SignUpScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToSModal, setShowToSModal] = useState(false);

  const handleUsernameChange = useCallback((value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
    if (cleaned.length > 0 && cleaned.length <= 4) {
      setUsernameError('Username must be more than 4 characters');
    } else {
      setUsernameError('');
    }
  }, []);

  const handleSignUp = async () => {
    // Validate form fields
    if (!username.trim()) {
      Alert.alert('Error', 'Please choose a username');
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

    // Check username availability
    setIsLoading(true);
    try {
      const available = await checkUsernameAvailable(username);
      if (!available) {
        setUsernameError('This username is already taken');
        setIsLoading(false);
        return;
      }
    } catch {
      Alert.alert('Error', 'Could not verify username availability. Please try again.');
      setIsLoading(false);
      return;
    }
    setIsLoading(false);

    // Show ToS modal for user acceptance
    setShowToSModal(true);
  };

  const handleAcceptToS = async () => {
    setShowToSModal(false);
    setIsLoading(true);

    try {
      await signUp({
        email: email.trim(),
        password,
        username: username.trim().toLowerCase(),
        displayName: displayName.trim() || undefined,
        tosAccepted: true,
        tosVersion: TOS_VERSION,
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

  const handleDeclineToS = () => {
    setShowToSModal(false);
    Alert.alert(
      'Terms Required',
      'You must accept the Terms of Service to create an account.'
    );
  };

  const handleSwitchMode = () => {
    router.replace('/(auth)/sign-in' as any);
  };

  return (
    <>
      <AuthForm
        mode="sign-up"
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        displayName={displayName}
        username={username}
        usernameError={usernameError}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onDisplayNameChange={setDisplayName}
        onUsernameChange={handleUsernameChange}
        onSubmit={handleSignUp}
        onSwitchMode={handleSwitchMode}
        isLoading={isLoading}
        isDark={isDark}
      />
      <TermsOfServiceModal
        visible={showToSModal}
        onAccept={handleAcceptToS}
        onDecline={handleDeclineToS}
      />
    </>
  );
}
