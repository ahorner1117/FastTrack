import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';

export default function AdminLayout() {
  const { isAdmin, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Redirect non-admins back to tabs
    if (!isAuthenticated || !isAdmin) {
      router.replace('/(tabs)');
    }
  }, [isAdmin, isAuthenticated]);

  // Don't render anything if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Portal',
          headerBackTitle: 'Settings',
        }}
      />
      <Stack.Screen
        name="user/[id]"
        options={{
          title: 'User Details',
          headerBackTitle: 'Users',
        }}
      />
    </Stack>
  );
}
