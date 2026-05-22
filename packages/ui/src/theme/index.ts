import { createContext, useContext } from 'react';
import { type Theme, darkTheme } from './dark';
import { lightTheme } from './light';

export { darkTheme, lightTheme };
export type { Theme };

export const ThemeContext = createContext<Theme>(darkTheme);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
