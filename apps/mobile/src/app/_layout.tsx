import { useFoilioFonts } from '@/lib/fonts';
import { useAuthStore } from '@/stores/auth';
import { ThemeContext, darkTheme } from '@foilio/ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

export default function RootLayout() {
  const [fontsLoaded] = useFoilioFonts();
  const authStatus = useAuthStore((s) => s.status);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    useAuthStore
      .getState()
      .initialize()
      .then((cleanup) => {
        unsubscribe = cleanup;
      });
    return () => unsubscribe?.();
  }, []);

  // Keep the splash up until fonts AND the initial auth check are both done
  if (!fontsLoaded || authStatus === 'unknown') {
    return null;
  }

  return (
    <ThemeContext.Provider value={darkTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: darkTheme.colors.bgBase },
        }}
      />
    </ThemeContext.Provider>
  );
}
