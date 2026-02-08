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
import { Trash2, ArrowLeft } from 'lucide-react-native';

import { LocationMap } from '../../src/components/Timer';
import { RunStatsCard } from '../../src/components/History';
import { useHistoryStore } from '../../src/stores/historyStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { COLORS } from '../../src/utils/constants';
import { formatDateTime } from '../../src/utils/formatters';

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const getRunById = useHistoryStore((state) => state.getRunById);
  const deleteRun = useHistoryStore((state) => state.deleteRun);
  const unitSystem = useSettingsStore((state) => state.unitSystem);

  const run = id ? getRunById(id) : undefined;

  const handleDelete = () => {
    Alert.alert(
      'Delete Run',
      'Are you sure you want to delete this run? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (id) {
              deleteRun(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (!run) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Stack.Screen
          options={{
            title: 'Run Details',
            headerShown: true,
            headerStyle: { backgroundColor: COLORS.dark.background },
            headerTintColor: COLORS.dark.text,
          }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Run Not Found</Text>
          <Text style={styles.emptySubtitle}>
            This run may have been deleted
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
          title: formatDateTime(run.createdAt),
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.dark.background },
          headerTintColor: COLORS.dark.text,
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Trash2 color={COLORS.dark.error} size={22} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <RunStatsCard run={run} unitSystem={unitSystem} />

        {/* Route Map */}
        {run.gpsPoints.length > 0 && (
          <View style={styles.mapSection}>
            <LocationMap
              latitude={null}
              longitude={null}
              isTracking={false}
              gpsPoints={run.gpsPoints}
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
          <Text style={styles.deleteFooterText}>Delete Run</Text>
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
  deleteButton: {
    padding: 8,
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
