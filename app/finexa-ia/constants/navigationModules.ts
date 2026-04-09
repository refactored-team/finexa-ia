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
    id: 'intelligence',
    name: 'Inteligencia',
    route: '/(tabs)/intelligence',
    icon: Brain,
  },
];
