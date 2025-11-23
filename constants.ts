
import { LayoutDashboard, FolderKanban, FileText, ShieldCheck, TrendingUp, CalendarDays, PieChart, Users, Settings, CalendarClock, BrainCircuit } from 'lucide-react';
import { ProjectStage } from './types';

// Colors matching the design system
export const COLORS = {
  background: '#F6F8FB',
  card: '#FFFFFF',
  teal: '#00B5D8',
  lime: '#6DD3A6',
  orange: '#FF9A3E',
  purple: '#7C6FF6',
  sidebarStart: '#2B3467',
  sidebarEnd: '#1A2040',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
};

// Configurable Financial Years (Starts Feb 1st)
export const FINANCIAL_YEARS = [
  'FY 2023/24',
  'FY 2024/25',
  'FY 2025/26',
  'FY 2026/27'
];

// Explicit order for Project Stages
export const STAGE_ORDER = [
  ProjectStage.NEGOTIATION,
  ProjectStage.PRE_START,
  ProjectStage.ON_SITE,
  ProjectStage.CLOSING_OUT,
  ProjectStage.FINAL_ACCOUNT,
  ProjectStage.FINALISED
];

export const NAV_ITEMS = [
  { section: 'MAIN', items: [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Projects', path: '/projects', icon: FolderKanban },
    { label: 'Applications', path: '/applications', icon: FileText },
    { label: 'Retention', path: '/retention', icon: ShieldCheck },
  ]},
  { section: 'INTELLIGENCE', items: [
    { label: 'Tender AI', path: '/tender-ai', icon: BrainCircuit },
  ]},
  { section: 'PLANNING', items: [
    { label: 'Project Management', path: '/pm', icon: CalendarClock },
    { label: 'Staffing', path: '/staffing', icon: Users },
  ]},
  { section: 'FINANCIAL', items: [
    { label: 'Cash Flow', path: '/cashflow', icon: TrendingUp },
    { label: 'Weekly Planner', path: '/weekly-planner', icon: CalendarDays },
  ]},
  { section: 'SYSTEM', items: [
    { label: 'Settings', path: '/settings', icon: Settings },
  ]}
];

export const FORMAT_CURRENCY = (pence: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(pence / 100);
};
