import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Files, 
  MessageSquare, 
  Users, 
  User,
  X,
  LogOut,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const employeeLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/report/new', icon: FileText, label: 'Daily Report' },
    { to: '/reports', icon: Files, label: 'My Reports' },
    { to: '/complaints', icon: MessageSquare, label: 'Complaints' },
  ];

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Admin Board' },
    { to: '/admin/employees', icon: Users, label: 'Employees' },
    { to: '/admin/reports', icon: Files, label: 'All Reports' },
    { to: '/admin/complaints', icon: MessageSquare, label: 'All Complaints' },
    { to: '/admin/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const links = isAdmin ? adminLinks : employeeLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-foreground/50 backdrop-blur-sm md:hidden animate-in fade-in" 
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar flex flex-col border-r border-border/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/20">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">WorkReport</span>
          </div>
          <button onClick={onClose} className="md:hidden text-muted-foreground hover:bg-muted p-1 rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Menu</div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => onClose()}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <link.icon size={18} className={cn("transition-colors", "group-hover:text-primary")} />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50 bg-sidebar/50 backdrop-blur-sm">
          <NavLink
            to="/profile"
            onClick={() => onClose()}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium mb-2 group",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            <User size={18} className="transition-colors group-hover:text-primary" />
            <span>Profile settings</span>
          </NavLink>
          <button 
            onClick={() => { logout(); onClose(); }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-left text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
