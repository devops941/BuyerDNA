import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Play,
  Database,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDataset } from '../../context/DatasetContext';
import { Button } from '../ui/Button';
import { analysisApi } from '../../api';
import toast from 'react-hot-toast';
import { navigationItems } from './Sidebar';

export const Navbar: React.FC<{ sidebarCollapsed: boolean }> = ({ sidebarCollapsed }) => {
  const { user, logout } = useAuth();
  const { datasets, selectedDatasetId, setSelectedDatasetId, selectedDataset } = useDataset();
  const location = useLocation();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Find current page title
  const currentNav = navigationItems.find((item) => item.path === location.pathname);
  const pageTitle = currentNav ? currentNav.name : 'Workspace';

  const handleRunAnalysis = async () => {
    let activeId = selectedDatasetId;
    if (!activeId && datasets.length > 0) {
      activeId = (datasets[0] as any)._id || (datasets[0] as any).id;
      if (activeId) setSelectedDatasetId(activeId);
    }

    if (!activeId) {
      toast.error('Please upload or select an active dataset first.');
      return;
    }

    setIsRunning(true);
    const toastId = toast.loading('Dispatching job to Python FastAPI ML engine...');

    try {
      const res = await analysisApi.startAnalysis(activeId, 'comprehensive');
      toast.success('ML Analysis pipeline started!', { id: toastId });
      navigate('/model-studio');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to start analysis', { id: toastId });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 transition-all duration-300 flex items-center justify-between px-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
        sidebarCollapsed ? 'left-20' : 'left-64'
      }`}
    >
      {/* Left: Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          <span className="text-slate-300 font-light">/</span>
          <span className="text-xs text-slate-500 font-medium hidden sm:inline truncate max-w-[220px]">
            {selectedDataset ? selectedDataset.name : 'Omnichannel Scope'}
          </span>
        </div>
      </div>

      {/* Right: Dataset Switcher, Run CTA, User */}
      <div className="flex items-center gap-3">
        {/* Global Dataset Selector */}
        <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">
          <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer max-w-[200px] truncate"
          >
            {datasets.length === 0 && <option value="">No datasets loaded</option>}
            {datasets.map((d: any) => {
              const dId = d._id || d.id;
              return (
                <option key={dId} value={dId}>
                  {d.name} ({d.rowCount} records)
                </option>
              );
            })}
          </select>
        </div>

        {/* Run Analysis Action Button */}
        <Button
          variant="primary"
          size="sm"
          icon={Play}
          onClick={handleRunAnalysis}
          isLoading={isRunning}
          disabled={!selectedDatasetId || selectedDataset?.status !== 'ready'}
        >
          Run ML Pipeline
        </Button>

        {/* Notification Bell */}
        <button
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-accent-500 absolute top-2 right-2 ring-2 ring-white"></span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 pl-2 rounded-lg hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden md:block leading-tight">
              <span className="text-xs font-bold text-slate-900 block">{user?.name}</span>
              <span className="text-[10px] text-slate-500 font-semibold block">{user?.role}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded w-fit">
                  <Shield className="w-3 h-3 text-slate-600" />
                  {user?.role}
                </div>
              </div>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  navigate('/settings');
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Settings & Profile
              </button>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
