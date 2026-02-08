import { Stack } from 'expo-router';

export default function ReportsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Reports Queue',
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
}
