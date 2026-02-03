import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { User, Shield, Calendar, Timer, Gauge } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { COLORS } from '@/src/utils/constants';
import { Card } from '@/src/components/common/Card';
import { getUserDetail, type AdminUserDetail } from '@/src/services/adminService';
import { formatTimeShort } from '@/src/utils/formatters';
import type { CloudRun } from '@/src/types';

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const [userDetail, setUserDetail] = useState<AdminUserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadUser = async () => {
      try {
        setError(null);
        const data = await getUserDetail(id);
        setUserDetail(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [id]);

  const formatCreatedAt = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRunTime = (timeMs: number | null) => {
    if (timeMs === null) return '-';
    return formatTimeShort(timeMs);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (error || !userDetail) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error || 'User not found'}
        </Text>
      </View>
    );
  }

  const { profile, runs } = userDetail;
  const displayName = profile.display_name || profile.email.split('@')[0];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Card isDark={isDark}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
            <User color="#000000" size={32} />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: colors.text }]}>
                {displayName}
              </Text>
              {profile.is_admin && (
                <View style={[styles.adminBadge, { backgroundColor: COLORS.accent }]}>
                  <Shield color="#000000" size={12} />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
            <Text style={[styles.email, { color: colors.textSecondary }]}>
              {profile.email}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.detailRow}>
          <Calendar color={colors.textSecondary} size={18} />
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Joined
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatCreatedAt(profile.created_at)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Timer color={colors.textSecondary} size={18} />
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            Total Runs
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {runs.length}
          </Text>
        </View>
      </Card>

      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        RUNS
      </Text>

      {runs.length === 0 ? (
        <Card isDark={isDark}>
          <View style={styles.emptyRuns}>
            <Gauge color={colors.textSecondary} size={32} />
            <Text style={[styles.emptyRunsText, { color: colors.textSecondary }]}>
              No runs recorded
            </Text>
          </View>
        </Card>
      ) : (
        runs.map((run: CloudRun) => (
          <Card key={run.id} isDark={isDark} style={styles.runCard}>
            <View style={styles.runHeader}>
              <Text style={[styles.runVehicle, { color: colors.text }]}>
                {run.vehicle_name || 'No Vehicle'}
              </Text>
              <Text style={[styles.runDate, { color: colors.textSecondary }]}>
                {formatCreatedAt(run.created_at)}
              </Text>
            </View>

            <View style={styles.runTimes}>
              <View style={styles.timeItem}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  0-60
                </Text>
                <Text style={[styles.timeValue, { color: colors.text }]}>
                  {formatRunTime(run.zero_to_sixty_time)}
                </Text>
              </View>
              <View style={styles.timeItem}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  0-100
                </Text>
                <Text style={[styles.timeValue, { color: colors.text }]}>
                  {formatRunTime(run.zero_to_hundred_time)}
                </Text>
              </View>
              <View style={styles.timeItem}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  1/4 mi
                </Text>
                <Text style={[styles.timeValue, { color: colors.text }]}>
                  {formatRunTime(run.quarter_mile_time)}
                </Text>
              </View>
              <View style={styles.timeItem}>
                <Text style={[styles.timeLabel, { color: colors.textSecondary }]}>
                  1/2 mi
                </Text>
                <Text style={[styles.timeValue, { color: colors.text }]}>
                  {formatRunTime(run.half_mile_time)}
                </Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '700',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  email: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  emptyRuns: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyRunsText: {
    fontSize: 14,
    marginTop: 8,
  },
  runCard: {
    marginBottom: 8,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  runVehicle: {
    fontSize: 16,
    fontWeight: '600',
  },
  runDate: {
    fontSize: 12,
  },
  runTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
