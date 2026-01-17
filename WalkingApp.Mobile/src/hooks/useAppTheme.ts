import { useColorScheme } from 'react-native';
import { useUserStore } from '@store/userStore';
import { lightTheme, darkTheme, lightNavigationTheme, darkNavigationTheme } from '@theme/theme';

export const useAppTheme = () => {
  const systemColorScheme = useColorScheme();
  const themePreference = useUserStore(
    (state) => state.currentUser?.preferences?.theme ?? 'system'
  );

  // Determine effective theme
  const effectiveTheme =
    themePreference === 'system' ? systemColorScheme : themePreference;

  const isDark = effectiveTheme === 'dark';

  return {
    paperTheme: isDark ? darkTheme : lightTheme,
    navigationTheme: isDark ? darkNavigationTheme : lightNavigationTheme,
    isDark,
  };
};
