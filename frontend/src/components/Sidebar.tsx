import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  AlertCircle,
  PlusCircle,
  BarChart3,
  Server,
  Users,
  Clock,
  History,
  ShieldCheck,
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role;

  const adminLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/incidents', label: 'All Incidents', icon: AlertCircle },
    { to: '/incidents/create', label: 'Report Incident', icon: PlusCircle },
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/services', label: 'IT Services', icon: Server },
    { to: '/technicians', label: 'Technicians', icon: Users },
    { to: '/sla', label: 'SLA Management', icon: Clock },
    { to: '/audit', label: 'Audit Trail', icon: History },
  ];

  const technicianLinks = [
    { to: '/', label: 'Technician Hub', icon: LayoutDashboard },
    { to: '/incidents?my_only=true', label: 'My Assigned Incidents', icon: AlertCircle },
    { to: '/incidents', label: 'All Incidents', icon: History },
    { to: '/sla', label: 'SLA Monitor', icon: Clock },
    { to: '/services', label: 'IT Services', icon: Server },
  ];

  const employeeLinks = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/incidents/create', label: 'Report New Incident', icon: PlusCircle },
    { to: '/incidents', label: 'My Incidents', icon: AlertCircle },
    { to: '/services', label: 'Service Catalog', icon: Server },
  ];

  const links =
    role === UserRole.ADMIN
      ? adminLinks
      : role === UserRole.TECHNICIAN
      ? technicianLinks
      : employeeLinks;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col border-r border-slate-800 shrink-0 select-none">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white shadow-md">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base text-white tracking-wide leading-none">I-ITSM Platform</h1>
          <span className="text-xs text-blue-400 font-mono">Incident Ops 2.0</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {role} Navigation
        </div>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 uppercase">
            {user?.name ? user.name[0] : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || user?.email}</p>
            <p className="text-[11px] text-slate-400 truncate capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

