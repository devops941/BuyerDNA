import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  UploadCloud,
  CheckCircle2,
  Sliders,
  Users,
  PieChart,
  Network,
  Cpu,
  Activity,
  TrendingUp,
  UserCheck,
  GitCompare,
  Lightbulb,
  FileSpreadsheet,
  History,
  Settings,
  Dna,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export interface NavGroup {
  groupName: string;
  items: {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const navigationGroups: NavGroup[] = [
  {
    groupName: 'Platform & Ingestion',
    items: [
      { name: 'Overview', path: '/', icon: LayoutDashboard },
      { name: 'Data Workspace', path: '/workspace', icon: Database },
      { name: 'Dataset Import', path: '/import', icon: UploadCloud },
      { name: 'Data Validation', path: '/validation', icon: CheckCircle2 },
      { name: 'Business Metrics', path: '/metrics', icon: Sliders },
    ],
  },
  {
    groupName: 'Analytical Engines',
    items: [
      { name: 'Customer Analytics', path: '/analytics', icon: Users },
      { name: 'RFM Analysis', path: '/rfm', icon: PieChart },
      { name: 'Customer Segmentation', path: '/segmentation', icon: Network },
      { name: 'ML Model Studio', path: '/model-studio', icon: Cpu, badge: 'FastAPI' },
      { name: 'Behaviour Analysis', path: '/behaviour', icon: Activity },
      { name: 'Demand Insights', path: '/demand', icon: TrendingUp },
    ],
  },
  {
    groupName: 'Intelligence & Actions',
    items: [
      { name: 'Customer Profiles', path: '/profiles', icon: UserCheck },
      { name: 'Segment Comparison', path: '/compare', icon: GitCompare },
      { name: 'Marketing Insights', path: '/insights', icon: Lightbulb },
      { name: 'Reports & Exports', path: '/reports', icon: FileSpreadsheet },
    ],
  },
  {
    groupName: 'Governance',
    items: [
      { name: 'Analysis History', path: '/history', icon: History },
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

// Flat list for navbar lookup
export const navigationItems = navigationGroups.flatMap((g) => g.items);

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 bg-[#0A0E1A] text-slate-200 flex flex-col border-r border-slate-800/70 shadow-2xl ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#0A0E1A]">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-500 p-[1px] shadow-sm shrink-0">
            <div className="w-full h-full bg-[#0A0E1A] rounded-[11px] flex items-center justify-center text-accent-400">
              <Dna className="w-5 h-5 text-accent-400" />
            </div>
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[15px] tracking-tight text-white block">
                  Buyer<span className="text-accent-400">DNA</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-accent-500/10 text-accent-400 border border-accent-500/20">
                  BI
                </span>
              </div>
              <span className="text-[10px] font-medium tracking-wide text-slate-400 block">
                Enterprise Intelligence
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Menu with Grouped Sections */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navigationGroups.map((group) => (
          <div key={group.groupName} className="space-y-0.5">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 select-none">
                {group.groupName}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-md shadow-brand-950/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    } ${collapsed ? 'justify-center px-0' : ''}`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isActive ? 'text-accent-300' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.name}</span>}
                      {!collapsed && item.badge && (
                        <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                          {item.badge}
                        </span>
                      )}
                      {isActive && !collapsed && !item.badge && (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-400 ml-auto shadow-[0_0_6px_#34D399]" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info with Status Indicator */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 bg-[#070A12]">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-400" />
              <span>SOC2 Compliant</span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-accent-400 text-[10px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
              FastAPI Online
            </span>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-accent-500 shadow-[0_0_6px_#10B981]"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
