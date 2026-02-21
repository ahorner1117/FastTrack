import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { COLORS } from '@/src/utils/constants';
import { sendPushNotification } from '@/src/services/notificationService';
import { logAdminAction } from '@/src/services/adminService';

interface SendNotificationModalProps {
  visible: boolean;
  userId: string;
  userDisplayName: string;
  isDark: boolean;
  onClose: () => void;
}

export function SendNotificationModal({
  visible,
  userId,
  userDisplayName,
  isDark,
  onClose,
}: SendNotificationModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const bgColor = isDark ? COLORS.dark.surface : '#FFFFFF';
  const textColor = isDark ? COLORS.dark.text : '#000000';
  const secondaryColor = isDark ? COLORS.dark.textSecondary : '#666666';
  const borderColor = isDark ? COLORS.dark.border : '#E0E0E0';
  const inputBg = isDark ? COLORS.dark.background : '#F5F5F5';

  const canSend = title.trim().length > 0 && message.trim().length > 0;

  const handleSend = async () => {
    if (!canSend) return;

    setIsSending(true);
    try {
      await sendPushNotification(userId, title.trim(), message.trim());
      await logAdminAction(
        'send_notification',
        'user',
        userId,
        `Title: ${title.trim()}`,
        { body: message.trim() }
      );
      Toast.show({
        type: 'success',
        text1: 'Notification Sent',
        text2: `Sent to ${userDisplayName}`,
      });
      setTitle('');
      setMessage('');
      onClose();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Failed to Send',
        text2: err.message || 'Something went wrong',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: bgColor }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Send Notification
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.recipient, { color: secondaryColor }]}>
            To: {userDisplayName}
          </Text>

          <Text style={[styles.label, { color: textColor }]}>Title</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: inputBg, color: textColor, borderColor },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Notification title"
            placeholderTextColor={secondaryColor}
            maxLength={100}
            returnKeyType="next"
          />

          <Text style={[styles.label, { color: textColor }]}>Message</Text>
          <TextInput
            style={[
              styles.input,
              styles.messageInput,
              { backgroundColor: inputBg, color: textColor, borderColor },
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder="Notification message"
            placeholderTextColor={secondaryColor}
            multiline
            textAlignVertical="top"
            maxLength={500}
            blurOnSubmit
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <Text style={[styles.charCount, { color: secondaryColor }]}>
            {message.length}/500
          </Text>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: borderColor }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor }]}
            onPress={handleClose}
            disabled={isSending}
          >
            <Text style={[styles.buttonText, { color: textColor }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.sendButton,
              { backgroundColor: canSend ? COLORS.accent : COLORS.accent + '40' },
            ]}
            onPress={handleSend}
            disabled={!canSend || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  headerTitle: {
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
  recipient: {
    fontSize: 14,
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  messageInput: {
    height: 120,
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
  sendButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
