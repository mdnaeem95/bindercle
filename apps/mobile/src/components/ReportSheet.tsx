import {
  REPORT_REASONS,
  type ReportReason,
  type ReportTargetType,
  useReportContent,
} from '@/hooks/useReportContent';
import { Surface, Text, useTheme } from '@foilio/ui';
import { X } from 'lucide-react-native';
import { Alert, Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ReportSheetProps = {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  /** Friendly label of what's being reported, shown in the header. */
  targetLabel?: string;
};

/**
 * Bottom-sheet-style modal that asks why the user is reporting and submits
 * to the `reports` table. Cross-platform (uses RN Modal, not ActionSheetIOS).
 */
export function ReportSheet({
  visible,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: ReportSheetProps) {
  const theme = useTheme();
  const report = useReportContent();

  const onPick = (reason: ReportReason) => {
    report.mutate(
      { target_type: targetType, target_id: targetId, reason },
      {
        onSuccess: () => {
          onClose();
          Alert.alert('Thanks for letting us know', "We'll review this and take action if needed.");
        },
        onError: (err) => {
          Alert.alert("Couldn't submit", err.message ?? 'Try again.');
        },
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          // Pressable here intercepts taps so they don't bubble up to the
          // dismiss-overlay above.
        >
          <Surface
            level={1}
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              borderTopWidth: 1,
              borderColor: theme.colors.borderSubtle,
            }}
          >
            <SafeAreaView edges={['bottom']}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 8,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="heading3">Report</Text>
                  {targetLabel && (
                    <Text variant="caption" tone="tertiary" numberOfLines={1}>
                      {targetLabel}
                    </Text>
                  )}
                </View>
                <Pressable onPress={onClose} hitSlop={8}>
                  <X size={20} color={theme.colors.textSecondary} strokeWidth={2} />
                </Pressable>
              </View>

              <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 4 }}>
                {REPORT_REASONS.map((r) => (
                  <Pressable
                    key={r.value}
                    onPress={() => onPick(r.value)}
                    disabled={report.isPending}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 14,
                      borderRadius: 12,
                      backgroundColor: pressed ? theme.colors.bgElevated2 : 'transparent',
                    })}
                  >
                    <Text variant="body">{r.label}</Text>
                  </Pressable>
                ))}
              </View>
            </SafeAreaView>
          </Surface>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
