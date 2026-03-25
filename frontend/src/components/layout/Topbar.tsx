import { Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 glass shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-muted-foreground md:hidden hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold tracking-tight text-foreground">{user?.name}</span>
          <span className="text-xs font-medium text-primary mt-0.5 capitalize bg-primary/10 px-2 py-0.5 rounded-full">{user?.role}</span>
        </div>
        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-indigo-400 flex items-center justify-center text-white font-bold text-base shadow-sm ring-2 ring-white border border-primary/20">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
