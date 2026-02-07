import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import { TOS_CONTENT } from '../../utils/tosContent';
import { Checkbox } from '../common/Checkbox';

interface TermsOfServiceModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TermsOfServiceModal: React.FC<TermsOfServiceModalProps> = ({
  visible,
  onAccept,
  onDecline,
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const isAcceptEnabled = hasScrolledToBottom && isChecked;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (isAcceptEnabled) {
      onAccept();
      // Reset state for next time
      setHasScrolledToBottom(false);
      setIsChecked(false);
    }
  };

  const handleDecline = () => {
    onDecline();
    // Reset state
    setHasScrolledToBottom(false);
    setIsChecked(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDecline}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleDecline}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Terms of Service</Text>
            <Text style={styles.subtitle}>
              Please read carefully before creating your account
            </Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <Text style={styles.tosText}>{TOS_CONTENT}</Text>
          </ScrollView>

          {!hasScrolledToBottom && (
            <View style={styles.scrollIndicator}>
              <Text style={styles.scrollIndicatorText}>
                ↓ Scroll to continue ↓
              </Text>
            </View>
          )}

          <View style={styles.checkboxContainer}>
            <Checkbox
              checked={isChecked}
              onValueChange={setIsChecked}
              label="I have read and agree to the Terms of Service"
              disabled={!hasScrolledToBottom}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.acceptButton,
                !isAcceptEnabled && styles.acceptButtonDisabled,
              ]}
              onPress={handleAccept}
              activeOpacity={0.8}
              disabled={!isAcceptEnabled}
            >
              <Text
                style={[
                  styles.acceptButtonText,
                  !isAcceptEnabled && styles.acceptButtonTextDisabled,
                ]}
              >
                I Accept
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: SCREEN_HEIGHT * 0.8,
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.dark.textSecondary,
  },
  scrollView: {
    flex: 1,
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tosText: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.dark.text,
  },
  scrollIndicator: {
    paddingVertical: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
  },
  scrollIndicatorText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '600',
  },
  checkboxContainer: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: COLORS.dark.background,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  declineButtonText: {
    color: COLORS.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: COLORS.accent,
  },
  acceptButtonDisabled: {
    backgroundColor: COLORS.dark.border,
  },
  acceptButtonText: {
    color: COLORS.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButtonTextDisabled: {
    color: COLORS.dark.textSecondary,
  },
});
