import React, { createContext, useContext } from 'react';
import type { CardTheme } from './cardTheme';
import { DEFAULT_THEME } from './cardTheme';

const CardThemeContext = createContext<CardTheme>(DEFAULT_THEME);

export const CardThemeProvider: React.FC<{
  theme: CardTheme;
  children: React.ReactNode;
}> = ({ theme, children }) => (
  <CardThemeContext.Provider value={theme}>{children}</CardThemeContext.Provider>
);

export const useCardTheme = (): CardTheme => useContext(CardThemeContext);
