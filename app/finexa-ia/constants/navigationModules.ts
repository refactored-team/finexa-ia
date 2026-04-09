import { BarChart3, BookOpen, Compass, Landmark, LayoutDashboard, LucideIcon } from './lucideIcons';

export type NavigationModule = {
  id: string;
  name: string;
  route: string;
  icon: LucideIcon;
};

export const NAVIGATION_MODULES: NavigationModule[] = [
  {
    id: 'dashboard',
    name: 'Panel',
    route: '/(tabs)/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'horizon',
    name: 'Horizonte',
    route: '/(tabs)/horizon',
    icon: Compass,
  },
  {
    id: 'link-bank',
    name: 'Bancos',
    route: '/(onboarding)/link-bank',
    icon: Landmark,
  },
  {
    id: 'simulation',
    name: 'Simulación',
    route: '/(tabs)/simulation',
    icon: BarChart3,
  },
  {
    id: 'wisdom',
    name: 'Sabiduría',
    route: '/(tabs)/wisdom',
    icon: BookOpen,
  },
];
