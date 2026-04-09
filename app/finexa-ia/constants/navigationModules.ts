import { Scissors } from 'lucide-react-native';
import { Brain, Compass, Landmark, LayoutDashboard, LucideIcon } from './lucideIcons';

export type NavigationModule = {
  id: string;
  name: string;
  route: string;
  icon: LucideIcon;
};

export const NAVIGATION_MODULES: NavigationModule[] = [
  {
    id: 'dashboard',
    name: 'Inicio',
    route: '/(tabs)/explore',
    icon: LayoutDashboard,
  },
  {
    id: 'horizon',
    name: 'Horizonte',
    route: '/(tabs)/horizon',
    icon: Compass,
  },
  // {
  //   id: 'link-bank',
  //   name: 'Bancos',
  //   route: '/(onboarding)/link-bank',
  //   icon: Landmark,
  // },
  {
    id: 'intelligence',
    name: 'Inteligencia',
    route: '/(tabs)/intelligence',
    icon: Brain,
  },
  {
    id: 'essential',
    name: 'Esencial',
    route: '/(tabs)/essential',
    icon: Scissors,
  },
];
