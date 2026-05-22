import { useFoilioFonts } from '@/lib/fonts';
import { ThemeContext, darkTheme } from '@foilio/ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const [fontsLoaded] = useFoilioFonts();

  if (!fontsLoaded) {
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
