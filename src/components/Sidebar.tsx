import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  SearchCode, 
  GitCompare, 
  History, 
  BookOpen, 
  Settings as SettingsIcon,
  ShieldCheck, 
  PanelLeftClose, 
  PanelLeftOpen,
  Lock
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isAuditorView: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  isAuditorView
}) => {
  const navItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Findings', path: '/findings', icon: SearchCode },
    { name: 'Compare Runs', path: '/compare', icon: GitCompare },
    { name: 'Compliance Trail', path: '/trail', icon: History },
    { name: 'Dark Pattern Guide', path: '/knowledge-base', icon: BookOpen },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <aside 
      className={`bg-[#102A56] text-white flex flex-col shrink-0 transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#183A73]">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#2F6FA3] flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="truncate">
              <span className="font-semibold text-base tracking-tight text-white block leading-tight">
                TrustLens AI
              </span>
              <span className="text-[11px] text-[#A5C4DC] font-normal block truncate">
                CCPA Compliance Engine
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-[#2F6FA3] mx-auto flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className={`text-[#A5C4DC] hover:text-white p-1.5 rounded hover:bg-[#183A73] transition-colors focus-visible:outline-2 focus-visible:outline-white ${
            collapsed ? 'hidden' : 'block'
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Auditor Status Pill */}
      {isAuditorView && !collapsed && (
        <div className="mx-3 mt-3 px-3 py-1.5 bg-[#183A73]/80 border border-[#2F6FA3] rounded-md flex items-center gap-2 text-xs text-[#EAF4F8]">
          <Lock className="w-3.5 h-3.5 text-[#EAF4F8] shrink-0" />
          <div className="truncate">
            <span className="font-medium">Auditor Mode</span>
            <span className="block text-[10px] text-[#A5C4DC]">Read-only session</span>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#2F6FA3] text-white shadow-xs'
                    : 'text-[#C5D5E8] hover:text-white hover:bg-[#183A73]/70'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle when collapsed */}
      {collapsed && (
        <div className="p-3 border-t border-[#183A73] flex justify-center">
          <button
            onClick={onToggleCollapse}
            className="text-[#A5C4DC] hover:text-white p-2 rounded hover:bg-[#183A73] transition-colors"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-[#183A73] text-[11px] text-[#89A6C4]">
          <div className="flex justify-between items-center mb-1">
            <span>Regulatory Corpus:</span>
            <span className="font-mono text-white text-[10px]">CCPA 2023</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Google Cloud:</span>
            <span className="text-[#A5C4DC] text-[10px]">Vertex AI + Run</span>
          </div>
        </div>
      )}
    </aside>
  );
};
