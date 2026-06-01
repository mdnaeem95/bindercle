import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  missing: string[];
};

/**
 * Last-resort failure screen rendered when validateLaunchEnv() returns
 * invalid. Intentionally has zero dependencies on theme, Sentry, PostHog,
 * Supabase, or anything else that could itself be the broken thing.
 * Pure RN + hardcoded brand colors.
 */
export function ConfigurationErrorScreen({ missing }: Props) {
  const onContact = () => {
    Linking.openURL('mailto:pika@bindercle.app?subject=Bindercle%20configuration%20error').catch(
      () => {},
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Configuration error</Text>
          <Text style={styles.body}>
            Bindercle couldn&apos;t start — some required settings are missing. This is on our end,
            not yours.
          </Text>
          {missing.length > 0 && (
            <View style={styles.missingBox}>
              <Text style={styles.missingLabel}>Missing</Text>
              {missing.map((key) => (
                <Text key={key} style={styles.missingItem}>
                  {key}
                </Text>
              ))}
            </View>
          )}
          <Pressable
            onPress={onContact}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          >
            <Text style={styles.buttonText}>Contact support</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    color: '#F8F8F2',
    fontSize: 28,
    fontWeight: '600',
  },
  body: {
    color: '#BCBCC4',
    fontSize: 16,
    lineHeight: 24,
  },
  missingBox: {
    backgroundColor: '#1A1A22',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  missingLabel: {
    color: '#7A7A85',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  missingItem: {
    color: '#F8F8F2',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  button: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    backgroundColor: '#2A2A35',
    borderWidth: 1,
    borderColor: '#3A3A48',
  },
  buttonPressed: {
    backgroundColor: '#3A3A48',
  },
  buttonText: {
    color: '#F8F8F2',
    fontSize: 15,
    fontWeight: '500',
  },
});
