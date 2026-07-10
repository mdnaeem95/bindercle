import { useToast } from '@/stores/toast';
import { Surface, Text, useTheme } from '@foilio/ui';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Root-mounted transient toast. Reads useToast; each show() bumps a token that
 * re-triggers the enter → hold → exit animation. One toast at a time.
 */
export function ToastHost() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const message = useToast((s) => s.message);
  const token = useToast((s) => s.token);
  const hide = useToast((s) => s.hide);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  // biome-ignore lint/correctness/useExhaustiveDependencies: token deliberately re-triggers the enter animation on a repeat toast of the same message.
  useEffect(() => {
    if (!message) return;
    opacity.value = withSequence(
      withTiming(1, { duration: 220 }),
      withDelay(
        2600,
        withTiming(0, { duration: 320 }, (finished) => {
          if (finished) runOnJS(hide)();
        }),
      ),
    );
    translateY.value = withSequence(
      withTiming(0, { duration: 220 }),
      withDelay(2600, withTiming(20, { duration: 320 })),
    );
    // token drives re-entry; message is read at fire time.
  }, [token, message, hide, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: insets.bottom + 72,
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Surface
        level={2}
        style={{
          paddingHorizontal: 18,
          paddingVertical: 14,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: theme.colors.borderDefault,
          maxWidth: 420,
        }}
      >
        <View>
          <Text variant="body" align="center">
            {message}
          </Text>
        </View>
      </Surface>
    </Animated.View>
  );
}
