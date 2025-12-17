import { createContext, useContext, useMemo } from 'react'
import { useColorMode } from '../components/ui/color-mode'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const { colorMode, toggleColorMode } = useColorMode()
    
    const isLight = colorMode === 'light'

    // Theme colors
    const theme = useMemo(() => ({
        mode: colorMode,
        isLight,

        // Backgrounds
        bg: isLight ? '#FFFFFF' : '#0F172A',
        pageBg: isLight ? '#EEF2F6' : '#0F171A',
        cardBg: isLight ? '#F8FAFC' : '#22294B',
        secondaryBg: isLight ? '#F8F9FA' : '#2e343e',
        inputBg: isLight ? '#FFFFFF' : '#0F112F',
        hoverBg: isLight ? '#E1E5E9' : '#334155',

        // Borders
        border: isLight ? '#DEE2E6' : '#334155',
        borderLight: isLight ? '#E9ECEF' : '#475569',
        borderInput: isLight ? "#B5B5B5" : "#777777",

        // Text colors
        text: isLight ? '#212529' : '#F1F5F9',
        textSecondary: isLight ? '#7e8a97' : '#7c8590',
        textMuted: isLight ? '#6C757D' : '#94A3B8',
        textPlaceholder: isLight ? '#ADB5BD' : '#64748B',
        textHighlight: isLight ? "#167BF0" : "#93C5FD",
        textBadge: isLight ? "#64748B" : "#d3ddeb",

        // Brand colors (stay consistent)
        primary: '#212529',
        primaryHover: '#343A40',
        accent: '#3B82F6',
        accentHover: '#2563EB',

        // Status colors
        success: '#198754',
        error: '#DC3545',
        warning: '#FFC107',

        // Header specific
        headerBg: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        headerBorder: isLight ? '#E9ECEF' : '#1E293B',

        // Buttons (theme color context)
        buttonBg: isLight ? '#3B82F6' : '#2563EB',
        buttonColor: '#FFFFFF',
        buttonHoverBg: isLight ? '#2563EB' : '#1D4ED8',
        buttonHoverColor: '#FFF',

        // Chart
        chartStroke: isLight ? "#3a3a3a" : "#d0d0d0",

        // Sidebar
        adminSidebarBg: isLight ? "#1E40AF" : "#05227e",
        sellerSidebarBg: isLight ? "#4c4c4c" : "#18181B",
    }), [colorMode, isLight])

    return (
        <ThemeContext.Provider value={{ 
            mode: colorMode, 
            isLight, 
            theme, 
            toggleTheme: toggleColorMode 
        }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}