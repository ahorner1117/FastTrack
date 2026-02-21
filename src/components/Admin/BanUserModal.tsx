import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, AlertTriangle } from 'lucide-react-native';
import type { BanUserInput } from '@/src/types';
import { COLORS } from '@/src/utils/constants';

interface BanUserModalProps {
  visible: boolean;
  userDisplayName: string;
  isDark: boolean;
  onClose: () => void;
  onBan: (input: BanUserInput) => Promise<void>;
}

export function BanUserModal({
  visible,
  userDisplayName,
  isDark,
  onClose,
  onBan,
}: BanUserModalProps) {
  const [reason, setReason] = useState('');
  const [isBanning, setIsBanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bgColor = isDark ? COLORS.dark.surface : '#FFFFFF';
  const textColor = isDark ? COLORS.dark.text : '#000000';
  const secondaryColor = isDark ? COLORS.dark.textSecondary : '#666666';
  const borderColor = isDark ? COLORS.dark.border : '#E0E0E0';
  const inputBg = isDark ? COLORS.dark.background : '#F5F5F5';

  const handleBan = async () => {
    setError(null);

    if (!reason.trim()) {
      setError('Please provide a reason for banning');
      return;
    }

    setIsBanning(true);

    try {
      await onBan({ reason: reason.trim() });
      onClose();
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to ban user');
    } finally {
      setIsBanning(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Text style={[styles.title, { color: textColor }]}>Ban User</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={[styles.warningBox, { backgroundColor: COLORS.error + '20' }]}>
            <AlertTriangle size={24} color={COLORS.error} />
            <View style={styles.warningContent}>
              <Text style={[styles.warningTitle, { color: COLORS.error }]}>
                Warning
              </Text>
              <Text style={[styles.warningText, { color: textColor }]}>
                Banning {userDisplayName} will prevent them from logging in to the app.
                All their data will be preserved.
              </Text>
            </View>
          </View>

          {error && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: COLORS.error + '20' },
              ]}
            >
              <Text style={[styles.errorText, { color: COLORS.error }]}>
                {error}
              </Text>
            </View>
          )}

          <Text style={[styles.label, { color: textColor }]}>
            Reason for Ban (Required)
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: inputBg, color: textColor, borderColor },
            ]}
            value={reason}
            onChangeText={setReason}
            placeholder="E.g., Inappropriate content, harassment, spam..."
            placeholderTextColor={secondaryColor}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: secondaryColor }]}>
            {reason.length}/500
          </Text>
        </View>

        <View style={[styles.footer, { borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor }]}
            onPress={onClose}
            disabled={isBanning}
          >
            <Text style={[styles.buttonText, { color: textColor }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.banButton,
              { backgroundColor: COLORS.error },
            ]}
            onPress={handleBan}
            disabled={isBanning}
          >
            {isBanning ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.banButtonText}>Ban User</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  warningBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  banButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  banButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
