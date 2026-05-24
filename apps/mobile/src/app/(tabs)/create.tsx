import { Surface } from '@foilio/ui';

/**
 * Placeholder for the Create tab. The tab bar intercepts `tabPress` and
 * routes to `/binders/new` so this screen is never actually rendered.
 * It exists purely so expo-router registers a "create" route.
 */
export default function CreateTab() {
  return <Surface level={0} style={{ flex: 1 }} />;
}
