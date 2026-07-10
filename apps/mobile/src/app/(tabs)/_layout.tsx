import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { useAuthStore } from '@/stores/auth';
import { useRequireAuth } from '@/stores/authGate';
import { useTheme } from '@foilio/ui';
import { Tabs, router } from 'expo-router';
import { Bell, House, Plus, Search, User } from 'lucide-react-native';
import { View } from 'react-native';

/**
 * Bottom tab bar for the signed-in app surface.
 *
 *   Home   Search   Create   Notifs   Profile
 *
 * Create + Profile both intercept tabPress instead of rendering a real
 * screen — Create routes to `/binders/new` (modal-ish), Profile routes
 * to the user's own `/users/[selfId]` so the existing profile screen
 * doubles as the tab content. The placeholder files only exist to
 * satisfy expo-router's route registration.
 */
export default function TabsLayout() {
  const theme = useTheme();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const requireAuth = useRequireAuth();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.colors.bgBase,
          borderTopColor: theme.colors.borderSubtle,
          borderTopWidth: 1,
          height: 56,
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: theme.colors.textPrimary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <House size={24} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color }) => <Search size={24} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: color,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus
                size={20}
                color={
                  // Inverse the icon color so the + sits cleanly on the filled chip.
                  color === theme.colors.textPrimary ? theme.colors.bgBase : theme.colors.bgBase
                }
                strokeWidth={2}
              />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            // "Build your own" is the headline wall. Signed in → straight to
            // binder creation; anonymous → contextual prompt, then the
            // onboarding wedge into /binders/new on success.
            requireAuth('create_binder', () => router.push('/binders/new'));
          },
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ color }) => (
            <View>
              <Bell size={24} color={color} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -3,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#FF7A8A',
                  }}
                />
              )}
            </View>
          ),
        }}
        listeners={{
          // Anon taps get the dismissable sign-in prompt (stay on the current
          // tab), not a bounce to the /sign-in dead-end. Signed-in taps fall
          // through to normal tab behavior.
          tabPress: (e) => {
            if (useAuthStore.getState().status !== 'authenticated') {
              e.preventDefault();
              requireAuth('view_notifications', () => router.navigate('/notifications'));
            }
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={1.8} />,
        }}
        listeners={{
          tabPress: (e) => {
            if (useAuthStore.getState().status !== 'authenticated') {
              e.preventDefault();
              requireAuth('view_profile', () => router.navigate('/profile'));
            }
          },
        }}
      />
    </Tabs>
  );
}
