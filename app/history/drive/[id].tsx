import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Trash2, ArrowLeft, Share2 } from 'lucide-react-native';

import { LocationMap } from '../../../src/components/Timer';
import { DriveStatsCard } from '../../../src/components/History';
import { useDriveHistoryStore } from '../../../src/stores/driveHistoryStore';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { COLORS } from '../../../src/utils/constants';
import { formatDateTime } from '../../../src/utils/formatters';

export default function DriveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const getDriveById = useDriveHistoryStore((state) => state.getDriveById);
  const deleteDrive = useDriveHistoryStore((state) => state.deleteDrive);
  const unitSystem = useSettingsStore((state) => state.unitSystem);

  const drive = id ? getDriveById(id) : undefined;

  const handleDelete = () => {
    Alert.alert(
      'Delete Drive',
      'Are you sure you want to delete this drive? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (id) {
              deleteDrive(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (!drive) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Stack.Screen
          options={{
            title: 'Drive Details',
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.dark.background },
            headerTintColor: COLORS.dark.text,
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Drive Not Found</Text>
          <Text style={styles.emptySubtitle}>
            This drive may have been deleted
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color={COLORS.accent} size={20} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen
        options={{
          title: formatDateTime(drive.createdAt),
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.dark.background },
          headerTintColor: COLORS.dark.text,
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/posts/create',
                    params: { driveId: id, vehicleId: drive.vehicleId || '' },
                  } as any)
                }
                style={styles.headerButton}
              >
                <Share2 color={COLORS.accent} size={22} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                <Trash2 color={COLORS.dark.error} size={22} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <DriveStatsCard drive={drive} unitSystem={unitSystem} />

        {/* Route Map */}
        {drive.gpsPoints.length > 0 && (
          <View style={styles.mapSection}>
            <LocationMap
              latitude={null}
              longitude={null}
              isTracking={false}
              gpsPoints={drive.gpsPoints}
              showRoute
              showStartMarker
              showEndMarker
              fitToRoute
              height={250}
            />
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteFooterButton}
          onPress={handleDelete}
        >
          <Trash2 color={COLORS.dark.error} size={20} />
          <Text style={styles.deleteFooterText}>Delete Drive</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  mapSection: {
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.dark.text,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.dark.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  deleteFooterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.dark.error,
  },
  deleteFooterText: {
    fontSize: 16,
    color: COLORS.dark.error,
    fontWeight: '500',
  },
});
