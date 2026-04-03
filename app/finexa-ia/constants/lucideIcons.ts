/**
 * Iconos desde `lucide-react-native/icons` (subpath oficial en `package.json` → `exports`).
 * Evita warnings de Metro: "not listed in the exports" al importar `dist/esm/icons/*.js`.
 */
export type { LucideIcon } from 'lucide-react-native';

export {
  Apple,
  ArrowLeft,
  ChevronRight,
  CircleQuestionMark,
  Eye,
  EyeOff,
  Globe,
  Landmark,
  Lock,
  Mail,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Wallet,
} from 'lucide-react-native/icons';

/** Mismo icono que antes (circle-question-mark); nombre corto para la UI. */
export { CircleQuestionMark as CircleHelp } from 'lucide-react-native/icons';
