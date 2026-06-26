import {
  Smartphone,
  Monitor,
  FolderOpen,
  Bell,
  ClipboardCopy,
  Settings,
  Zap,
} from 'lucide-react';
import { useDeviceStore, type ActiveView } from '../stores/deviceStore';

const navItems: { id: ActiveView; icon: typeof Smartphone; label: string }[] = [
  { id: 'devices', icon: Smartphone, label: 'Devices' },
  { id: 'mirror', icon: Monitor, label: 'Mirror' },
  { id: 'files', icon: FolderOpen, label: 'Files' },
  { id: 'notifications', icon: Bell, label: 'Alerts' },
  { id: 'clipboard', icon: ClipboardCopy, label: 'Clipboard' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { activeView, setActiveView, connectionState } = useDeviceStore();

  const isConnected = connectionState === 'connected';

  return (
    <aside className="flex flex-col items-center w-[72px] h-screen bg-bg-secondary/80 backdrop-blur-xl border-r border-border py-4 relative z-10">
      {/* Logo */}
      <div className="flex items-center justify-center w-11 h-11 mb-6 rounded-xl bg-gradient-to-br from-accent to-accent-violet shadow-lg shadow-accent-glow/30">
        <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
        {navItems.map(({ id, icon: Icon, label }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`
                group relative flex flex-col items-center justify-center w-full py-2.5 rounded-xl
                transition-all duration-200 ease-out cursor-pointer
                ${isActive
                  ? 'bg-accent/15 text-accent-light shadow-[0_0_20px_rgba(99,102,241,0.12)]'
                  : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
                }
              `}
              title={label}
            >
              {/* Active indicator line */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full animate-fade-in" />
              )}

              <Icon
                className={`w-[20px] h-[20px] transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-accent-light' : ''
                }`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span
                className={`text-[10px] mt-1 font-medium tracking-wide transition-colors duration-200 ${
                  isActive ? 'text-accent-light' : 'text-text-muted group-hover:text-text-secondary'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Connection Status Dot */}
      <div className="mt-auto pt-4 flex flex-col items-center gap-1.5">
        <div className="relative">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
              isConnected
                ? 'bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                : connectionState === 'disconnected'
                  ? 'bg-text-muted'
                  : 'bg-warning animate-pulse'
            }`}
          />
          {isConnected && (
            <div className="absolute inset-0 rounded-full bg-success/40 animate-ping" />
          )}
        </div>
        <span className="text-[9px] text-text-muted font-medium">
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </div>
    </aside>
  );
}
