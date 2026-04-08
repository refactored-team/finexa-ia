import { BarChart3, BookOpen, LayoutDashboard, LucideIcon, Wallet } from './lucideIcons';

export type NavigationModule = {
  id: string;
  name: string;
  route: string;
  icon: LucideIcon;
};

export const NAVIGATION_MODULES: NavigationModule[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    route: '/(tabs)/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'simulation',
    name: 'Simulation',
    route: '/(tabs)/simulation',
    icon: BarChart3,
  },
  {
    id: 'wisdom',
    name: 'Wisdom',
    route: '/(tabs)/wisdom',
    icon: BookOpen,
  },
  {
    id: 'vault',
    name: 'Vault',
    route: '/(tabs)/vault',
    icon: Wallet,
  },
];
