export const theme = {
  colors: {
    primary: '#0F5132',        // Deep Islamic Emerald Green
    primaryLight: '#198754',   // Lighter Green
    primaryDark: '#0A3622',    // Dark Forest Green
    gold: '#D4AF37',           // Elegant Islamic Gold
    goldLight: '#F3E5AB',      // Soft Gold
    accent: '#C5A059',         // Muted Gold
    background: '#F8F9FA',     // Soft Off-White
    cardBg: '#FFFFFF',         // Crisp White
    cardBgDark: '#122620',     // Dark Islamic Card
    textPrimary: '#1E293B',    // Dark Slate
    textSecondary: '#64748B',  // Slate Gray
    textLight: '#F8FAFC',      // Off-White for dark backgrounds
    border: '#E2E8F0',         // Soft border
    success: '#10B981',        // Emerald success
    warning: '#F59E0B',        // Amber
    danger: '#EF4444',         // Red
    silentActive: '#8B5CF6',    // Purple for Silent Mode indicator
  },
  typography: {
    fontFamily: {
      regular: 'System',
      bold: 'System',
    }
  },
  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
    },
    activeCard: {
      shadowColor: '#0F5132',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    }
  }
};
