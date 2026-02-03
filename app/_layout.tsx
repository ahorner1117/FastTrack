import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useSettingsStore } from '@/src/stores/settingsStore';
import { useAuthStore } from '@/src/stores/authStore';
import { initializeAuth } from '@/src/services/authService';
import { COLORS } from '@/src/utils/constants';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

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
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Initialize auth when fonts are loaded
      initializeAuth().then(() => {
        SplashScreen.hideAsync();
      });
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to sign-in if not authenticated
      router.replace('/(auth)/sign-in' as any);
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated and in auth group
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);
}

function RootLayoutNav() {
  const systemColorScheme = useColorScheme();
  const { appearance } = useSettingsStore();
  const { isLoading } = useAuthStore();

  useProtectedRoute();

  const colorScheme =
    appearance === 'system' ? systemColorScheme : appearance;
  const colors = colorScheme === 'dark' ? COLORS.dark : COLORS.light;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

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
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
