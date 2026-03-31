import { PrismColors } from '@/constants/theme';

/** Growth / success: tertiary → primary (use with `expo-linear-gradient`). */
export const gradientGrowth = [PrismColors.tertiary, PrismColors.primary] as const;

/** Warning: secondary → alert/danger. */
export const gradientWarning = [PrismColors.secondary, PrismColors.danger] as const;
