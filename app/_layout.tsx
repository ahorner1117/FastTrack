import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { useAuthStore } from '@/src/stores/authStore';
import { initializeAuth } from '@/src/services/authService';
import { supabase } from '@/src/lib/supabase';
import { COLORS } from '@/src/utils/constants';
import { RPMGauge } from '@/src/components/Loading';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Hide native splash immediately - we'll show our custom RPM gauge instead
SplashScreen.preventAutoHideAsync().then(() => {
  SplashScreen.hideAsync();
});

const FastTrackDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.dark.background,
    card: COLORS.dark.surface,
    text: COLORS.dark.text,
    border: COLORS.dark.border,
    primary: COLORS.accent,
  },
};

const FastTrackLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.light.background,
    card: COLORS.light.surface,
    text: COLORS.light.text,
    border: COLORS.light.border,
    primary: COLORS.light.success,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    // Initialize auth immediately
    initializeAuth().then(() => {
      setAuthInitialized(true);
    });
  }, []);

  // Show RPM gauge while fonts or auth are loading
  if (!fontsLoaded || !authInitialized) {
    return <RPMGauge />;
  }

  return <RootLayoutNav />;
}

function useProtectedRoute() {
  const { isAuthenticated, isLoading, profile } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';
    const onSetUsername = segments[1] === 'set-username';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to sign-in if not authenticated
      router.replace('/(auth)/sign-in' as any);
    } else if (isAuthenticated && !inAuthGroup && profile && !profile.username) {
      // Redirect to set-username if authenticated but no username set
      router.replace('/(auth)/set-username' as any);
    } else if (isAuthenticated && inAuthGroup && !onSetUsername && profile?.username) {
      // Redirect to tabs if authenticated, has username, and in auth group
      router.replace('/(tabs)');
    } else if (isAuthenticated && onSetUsername && profile?.username) {
      // Username now set, redirect to tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, profile?.username]);
}

function handleResetPasswordDeepLink(url: string, router: ReturnType<typeof useRouter>) {
  if (!url.includes('reset-password')) return;

  const fragment = url.split('#')[1];
  if (!fragment) return;

  const params = new URLSearchParams(fragment);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');

  if (accessToken && refreshToken) {
    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(() => {
        router.replace('/(auth)/reset-password' as any);
      })
      .catch((err) => {
        console.error('Error setting session from reset link:', err);
      });
  }
}

function RootLayoutNav() {
  const systemColorScheme = useColorScheme();
  const { appearance } = useSettingsStore();
  const router = useRouter();

  useProtectedRoute();

  // Handle deep links for password reset
  useEffect(() => {
    // Handle URL when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleResetPasswordDeepLink(url, router);
    });

    // Handle URL when app is cold-started
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleResetPasswordDeepLink(url, router);
      }
    });

    return () => subscription.remove();
  }, [router]);

  const colorScheme =
    appearance === 'system' ? systemColorScheme : appearance;

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? FastTrackDarkTheme : FastTrackLightTheme}
    >
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="history/[id]"
          options={{
            headerShown: true,
            headerBackTitle: 'History',
          }}
        />
        <Stack.Screen
          name="vehicles/add"
          options={{
            headerShown: true,
            title: 'Add Vehicle',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="vehicles/[id]"
          options={{
            headerShown: true,
            headerBackTitle: 'Garage',
          }}
        />
        <Stack.Screen
          name="vehicles/edit/[id]"
          options={{
            headerShown: true,
            title: 'Edit Vehicle',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="friends/add"
          options={{
            headerShown: true,
            title: 'Add Friends',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="friends/requests"
          options={{
            headerShown: true,
            title: 'Friend Requests',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: 'Settings',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="user/[id]"
          options={{
            headerShown: true,
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="admin"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="posts/create"
          options={{
            headerShown: true,
            title: 'New Post',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="posts/[id]"
          options={{
            headerShown: true,
            headerBackTitle: 'Explore',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

