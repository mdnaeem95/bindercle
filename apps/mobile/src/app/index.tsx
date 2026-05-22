import { FoilioWordmark, Surface, Text } from '@foilio/ui';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <Surface level={0} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <FoilioWordmark size={72} />
        <Text variant="display2" tone="secondary" align="center">
          your collection, on display
        </Text>
      </SafeAreaView>
    </Surface>
  );
}
