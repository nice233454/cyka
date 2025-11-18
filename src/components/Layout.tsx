import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  Users,
  UserCircle,
  CheckSquare,
  MessageSquare,
  Settings,
  FileText,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const menuItems = [
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'users', label: 'Users', icon: UserCircle },
    { id: 'checklists', label: 'Checklists', icon: CheckSquare },
    { id: 'prompts', label: 'LLM Prompts', icon: MessageSquare },
    { id: 'integrations', label: 'Integrations', icon: Settings },
    { id: 'logs', label: 'Processing Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 className="text-xl font-bold text-gray-900">Salvio Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.full_name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        <aside
          className={`${
            menuOpen ? 'block' : 'hidden'
          } lg:block w-64 bg-white border-r border-gray-200 min-h-screen`}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm ${
                    currentPage === item.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
