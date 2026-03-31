/**
 * Iconos Lucide vía rutas directas a los módulos en `dist/esm/icons`.
 * No usar el entry `lucide-react-native`: importa todos los iconos y Metro puede
 * fallar (p. ej. si falta un `.js` suelto) o el bundle crece innecesariamente.
 */
export type { LucideIcon } from 'lucide-react-native';

export { default as ArrowLeft } from 'lucide-react-native/dist/esm/icons/arrow-left.js';
export { default as Apple } from 'lucide-react-native/dist/esm/icons/apple.js';
export { default as ChevronRight } from 'lucide-react-native/dist/esm/icons/chevron-right.js';
export { default as CircleHelp } from 'lucide-react-native/dist/esm/icons/circle-question-mark.js';
export { default as Eye } from 'lucide-react-native/dist/esm/icons/eye.js';
export { default as EyeOff } from 'lucide-react-native/dist/esm/icons/eye-off.js';
export { default as Globe } from 'lucide-react-native/dist/esm/icons/globe.js';
export { default as Landmark } from 'lucide-react-native/dist/esm/icons/landmark.js';
export { default as Lock } from 'lucide-react-native/dist/esm/icons/lock.js';
export { default as Mail } from 'lucide-react-native/dist/esm/icons/mail.js';
export { default as Shield } from 'lucide-react-native/dist/esm/icons/shield.js';
export { default as Sparkles } from 'lucide-react-native/dist/esm/icons/sparkles.js';
export { default as Target } from 'lucide-react-native/dist/esm/icons/target.js';
export { default as TrendingUp } from 'lucide-react-native/dist/esm/icons/trending-up.js';
export { default as User } from 'lucide-react-native/dist/esm/icons/user.js';
export { default as Wallet } from 'lucide-react-native/dist/esm/icons/wallet.js';
