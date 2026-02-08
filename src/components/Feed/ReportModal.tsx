import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { X, AlertCircle } from 'lucide-react-native';
import { COLORS } from '@/src/utils/constants';

interface ReportModalProps {
  visible: boolean;
  isDark: boolean;
  type: 'post' | 'comment';
  onClose: () => void;
  onSubmit: (reason: string, description?: string) => Promise<void>;
}

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', description: 'Unwanted commercial content or repetitive messages' },
  { id: 'inappropriate', label: 'Inappropriate Content', description: 'Offensive, graphic, or harmful content' },
  { id: 'harassment', label: 'Harassment', description: 'Bullying, threats, or targeted attacks' },
  { id: 'misinformation', label: 'Misinformation', description: 'False or misleading information' },
  { id: 'other', label: 'Other', description: 'Another reason not listed above' },
];

export function ReportModal({
  visible,
  isDark,
  type,
  onClose,
  onSubmit,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bgColor = isDark ? COLORS.dark.card : '#FFFFFF';
  const textColor = isDark ? COLORS.dark.text : '#000000';
  const secondaryColor = isDark ? COLORS.dark.textSecondary : '#666666';
  const borderColor = isDark ? COLORS.dark.border : '#E0E0E0';
  const inputBg = isDark ? COLORS.dark.background : '#F5F5F5';

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);

    if (!selectedReason) {
      setError('Please select a reason');
      return;
    }

    setIsSubmitting(true);

    try {
      const reasonLabel = REPORT_REASONS.find((r) => r.id === selectedReason)?.label || selectedReason;
      await onSubmit(reasonLabel, description.trim() || undefined);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Text style={[styles.title, { color: textColor }]}>
            Report {type === 'post' ? 'Post' : 'Comment'}
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={[styles.infoBox, { backgroundColor: COLORS.warning + '20' }]}>
            <AlertCircle size={20} color={COLORS.warning} />
            <Text style={[styles.infoText, { color: textColor }]}>
              Help us understand what's wrong. Your report will be reviewed by our moderation team.
            </Text>
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
            Why are you reporting this?
          </Text>

          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.reasonOption,
                {
                  backgroundColor: selectedReason === reason.id ? COLORS.accent + '20' : inputBg,
                  borderColor: selectedReason === reason.id ? COLORS.accent : borderColor,
                },
              ]}
              onPress={() => setSelectedReason(reason.id)}
            >
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: selectedReason === reason.id ? COLORS.accent : borderColor,
                    backgroundColor: selectedReason === reason.id ? COLORS.accent : 'transparent',
                  },
                ]}
              >
                {selectedReason === reason.id && (
                  <View style={[styles.radioInner, { backgroundColor: '#000000' }]} />
                )}
              </View>
              <View style={styles.reasonContent}>
                <Text style={[styles.reasonLabel, { color: textColor }]}>
                  {reason.label}
                </Text>
                <Text style={[styles.reasonDescription, { color: secondaryColor }]}>
                  {reason.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={[styles.label, { color: textColor, marginTop: 20 }]}>
            Additional Details (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: inputBg, color: textColor, borderColor },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Provide more context about your report..."
            placeholderTextColor={secondaryColor}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: secondaryColor }]}>
            {description.length}/500
          </Text>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor }]}
            onPress={handleClose}
            disabled={isSubmitting}
          >
            <Text style={[styles.buttonText, { color: textColor }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              { backgroundColor: COLORS.error },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
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
  },
  contentContainer: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
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
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 10,
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  reasonDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
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
  submitButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
