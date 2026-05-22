import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import { useFonts } from 'expo-font';

/**
 * Foilio font loader.
 *
 * Maps Google Fonts NPM package exports to the `fontFamily` strings used in
 * packages/ui/tokens.ts.
 *
 * Source of truth for font names: BRAND.md §5.
 */
export function useFoilioFonts() {
  return useFonts({
    Geist: Geist_400Regular,
    'Geist-Medium': Geist_500Medium,
    'Geist-Semibold': Geist_600SemiBold,
    GeistMono: GeistMono_400Regular,
    InstrumentSerif: InstrumentSerif_400Regular,
    'InstrumentSerif-Italic': InstrumentSerif_400Regular_Italic,
  });
}
