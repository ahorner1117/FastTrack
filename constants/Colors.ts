import { COLORS } from '../src/utils/constants';

const tintColorLight = COLORS.light.success;
const tintColorDark = COLORS.accent;

export default {
  light: {
    text: COLORS.light.text,
    background: COLORS.light.background,
    tint: tintColorLight,
    tabIconDefault: COLORS.light.textTertiary,
    tabIconSelected: tintColorLight,
    surface: COLORS.light.surface,
    border: COLORS.light.border,
    textSecondary: COLORS.light.textSecondary,
    error: COLORS.light.error,
    surfaceElevated: COLORS.light.surfaceElevated,
  },
  dark: {
    text: COLORS.dark.text,
    background: COLORS.dark.background,
    tint: tintColorDark,
    tabIconDefault: COLORS.dark.textTertiary,
    tabIconSelected: tintColorDark,
    surface: COLORS.dark.surface,
    border: COLORS.dark.border,
    textSecondary: COLORS.dark.textSecondary,
    error: COLORS.dark.error,
    surfaceElevated: COLORS.dark.surfaceElevated,
  },
};
