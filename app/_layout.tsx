import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useSettingsStore } from '@/src/stores/settingsStore';
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
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const systemColorScheme = useColorScheme();
  const { appearance } = useSettingsStore();

  const colorScheme =
    appearance === 'system' ? systemColorScheme : appearance;

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? FastTrackDarkTheme : FastTrackLightTheme}
    >
      <Stack>
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
      </Stack>
    </ThemeProvider>
  );
}
