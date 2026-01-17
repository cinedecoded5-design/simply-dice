import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeId = 'neon' | 'candy' | 'forest' | 'ocean' | 'sunset';

interface Theme {
  id: ThemeId;
  name: string;
  colors: {
    primary: string; // Player A / Accent
    secondary: string; // Player B
    bgGradient: string; // Not used heavily in chalk theme, but kept for logic compatibility
    surface: string; // Panels/Modals
  };
}

const themes: Record<ThemeId, Theme> = {
  neon: {
    id: 'neon',
    name: 'Classic Chalk',
    colors: {
      primary: '#f87171', // Red Chalk
      secondary: '#60a5fa', // Blue Chalk
      bgGradient: 'radial-gradient(circle at center, #2e353b 0%, #171a1d 100%)',
      surface: '#27272a'
    }
  },
  candy: {
    id: 'candy',
    name: 'Pastel Chalk',
    colors: {
      primary: '#fbbf24', // Yellow Chalk
      secondary: '#a78bfa', // Purple Chalk
      bgGradient: 'radial-gradient(circle at center, #2e353b 0%, #171a1d 100%)',
      surface: '#4c1d95'
    }
  },
  forest: {
    id: 'forest',
    name: 'Nature Chalk',
    colors: {
      primary: '#4ade80', // Green Chalk
      secondary: '#facc15', // Yellow Chalk
      bgGradient: 'radial-gradient(circle at center, #14281d 0%, #05100a 100%)',
      surface: '#14532d'
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Sea Chalk',
    colors: {
      primary: '#22d3ee', // Cyan Chalk
      secondary: '#38bdf8', // Sky Chalk
      bgGradient: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
      surface: '#1e3a8a'
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Warm Chalk',
    colors: {
      primary: '#fb923c', // Orange Chalk
      secondary: '#e879f9', // Pink Chalk
      bgGradient: 'radial-gradient(circle at center, #2a1815 0%, #1a0f0e 100%)',
      surface: '#7c2d12'
    }
  }
};

interface ThemeContextType {
  currentTheme: ThemeId;
  setTheme: (id: ThemeId) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to convert Hex to RGB for Tailwind opacity utility
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('neon');

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;

    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--secondary', theme.colors.secondary);
    root.style.setProperty('--surface', theme.colors.surface);
    root.style.setProperty('--bg-gradient', theme.colors.bgGradient);

    // RGB variables for opacity
    const primaryRgb = hexToRgb(theme.colors.primary);
    const secondaryRgb = hexToRgb(theme.colors.secondary);
    const surfaceRgb = hexToRgb(theme.colors.surface);

    if (primaryRgb) root.style.setProperty('--primary-rgb', primaryRgb);
    if (secondaryRgb) root.style.setProperty('--secondary-rgb', secondaryRgb);
    if (surfaceRgb) root.style.setProperty('--surface-rgb', surfaceRgb);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{
      currentTheme,
      setTheme: setCurrentTheme,
      availableThemes: Object.values(themes)
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};