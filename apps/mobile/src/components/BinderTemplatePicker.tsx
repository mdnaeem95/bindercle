import { BINDER_TEMPLATES, type BinderTemplate } from '@/lib/binderTemplates';
import { Button, Surface, Text, accentSolid, useTheme } from '@foilio/ui';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

type BinderTemplatePickerProps = {
  onPick: (template: BinderTemplate) => void;
  onSkip: () => void;
};

/**
 * Pre-form sheet shown at the start of the new-binder flow.
 *
 * Each template is a fully-formed "vibe" — title, description, tags,
 * accent, layout — that the user can take as-is or edit before saving.
 *
 * "Start blank" is always an out for users who know exactly what they
 * want.
 */
export function BinderTemplatePicker({ onPick, onSkip }: BinderTemplatePickerProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Surface level={0} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{
            padding: 24,
            gap: 24,
            paddingBottom: 48 + insets.bottom,
          }}
        >
          <View style={{ gap: 8 }}>
            <Text variant="display2">start with a vibe ✨</Text>
            <Text variant="body" tone="secondary">
              Pick a theme to scaffold a binder — or start blank and make it yours.
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            {BINDER_TEMPLATES.map((template) => {
              const tint = accentSolid(template.preset.accent_color);
              return (
                <Pressable
                  key={template.id}
                  onPress={() => onPick(template)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: 16,
                    backgroundColor: theme.colors.bgElevated1,
                    borderWidth: 1,
                    borderColor: tint ?? theme.colors.borderSubtle,
                    opacity: pressed ? 0.8 : 1,
                    gap: 16,
                  })}
                >
                  <Text variant="display2">{template.emoji}</Text>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text variant="heading3" style={tint ? { color: tint } : undefined}>
                      {template.name}
                    </Text>
                    <Text variant="bodySmall" tone="secondary" numberOfLines={2}>
                      {template.blurb}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Button variant="ghost" size="md" onPress={onSkip}>
            Start blank
          </Button>
        </ScrollView>
      </SafeAreaView>
    </Surface>
  );
}
