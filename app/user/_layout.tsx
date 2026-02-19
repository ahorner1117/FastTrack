import { Stack } from 'expo-router';

export default function UserLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ headerShown: true, headerBackTitle: 'Back' }} />
      <Stack.Screen name="vehicle/[id]" options={{ headerShown: true, headerBackTitle: 'Back' }} />
    </Stack>
  );
}
