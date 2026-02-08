import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import type { CloudRun } from '@/src/types';
import { COLORS } from '@/src/utils/constants';
import { formatTimeShort } from '@/src/utils/formatters';

interface RunListItemProps {
  run: CloudRun;
  isDark: boolean;
  onDelete: (runId: string) => void;
}

export function RunListItem({ run, isDark, onDelete }: RunListItemProps) {
  const textColor = isDark ? COLORS.dark.text : '#000000';
  const secondaryColor = isDark ? COLORS.dark.textSecondary : '#666666';
  const borderColor = isDark ? COLORS.dark.border : '#E0E0E0';

  const handleDelete = () => {
    Alert.alert(
      'Delete Run',
      'Are you sure you want to permanently delete this run? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(run.id),
        },
      ]
    );
  };

  const formatTime = (timeMs: number | null) => {
    if (timeMs === null) return '-';
    return formatTimeShort(timeMs);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={[styles.container, { borderBottomColor: borderColor }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.vehicleName, { color: textColor }]}>
            {run.vehicle_name || 'No Vehicle'}
          </Text>
          <Text style={[styles.date, { color: secondaryColor }]}>
            {formatDate(run.created_at)}
          </Text>
        </View>

        <View style={styles.times}>
          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: secondaryColor }]}>
              0-60
            </Text>
            <Text style={[styles.timeValue, { color: textColor }]}>
              {formatTime(run.zero_to_sixty_time)}
            </Text>
          </View>

          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: secondaryColor }]}>
              0-100
            </Text>
            <Text style={[styles.timeValue, { color: textColor }]}>
              {formatTime(run.zero_to_hundred_time)}
            </Text>
          </View>

          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: secondaryColor }]}>
              1/4 mi
            </Text>
            <Text style={[styles.timeValue, { color: textColor }]}>
              {formatTime(run.quarter_mile_time)}
            </Text>
          </View>

          <View style={styles.timeItem}>
            <Text style={[styles.timeLabel, { color: secondaryColor }]}>
              1/2 mi
            </Text>
            <Text style={[styles.timeValue, { color: textColor }]}>
              {formatTime(run.half_mile_time)}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: COLORS.error + '20' }]}
        onPress={handleDelete}
      >
        <Trash2 size={18} color={COLORS.error} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
