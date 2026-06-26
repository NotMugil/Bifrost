import { useState } from 'react';
import {
  Bell,
  BellOff,
  MessageSquare,
  Search,
  Filter,
  Reply,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
} from 'lucide-react';
import { useDeviceStore } from '../stores/deviceStore';

interface Notification {
  id: string;
  app: string;
  appIcon: typeof MessageSquare;
  title: string;
  body: string;
  timestamp: string;
  isMessaging: boolean;
  color: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    app: 'Messages',
    appIcon: MessageCircle,
    title: 'Sarah Chen',
    body: 'Hey! Are you coming to the meeting later today? I have some updates to share.',
    timestamp: '2 min ago',
    isMessaging: true,
    color: 'text-blue-400',
  },
  {
    id: '2',
    app: 'Gmail',
    appIcon: Mail,
    title: 'Project Update — Sprint Review',
    body: 'The sprint review is scheduled for tomorrow at 3 PM. Please prepare your demos.',
    timestamp: '15 min ago',
    isMessaging: false,
    color: 'text-red-400',
  },
  {
    id: '3',
    app: 'WhatsApp',
    appIcon: MessageSquare,
    title: 'Dev Team',
    body: 'Alex: The new build is ready for testing 🚀',
    timestamp: '32 min ago',
    isMessaging: true,
    color: 'text-green-400',
  },
  {
    id: '4',
    app: 'Phone',
    appIcon: Phone,
    title: 'Missed Call',
    body: 'Missed call from +1 (555) 123-4567',
    timestamp: '1 hr ago',
    isMessaging: false,
    color: 'text-emerald-400',
  },
  {
    id: '5',
    app: 'Calendar',
    appIcon: Calendar,
    title: 'Team Standup',
    body: 'Daily standup in 30 minutes — Conference Room B',
    timestamp: '1 hr ago',
    isMessaging: false,
    color: 'text-accent-light',
  },
];

export default function NotificationPanel() {
  const { connectionState } = useDeviceStore();
  const isConnected = connectionState === 'connected';
  const [autoSync, setAutoSync] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(mockNotifications);

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-32 h-32 rounded-3xl bg-bg-surface/60 border border-border flex items-center justify-center mb-6">
          <Bell className="w-14 h-14 text-text-muted/30" strokeWidth={1} />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Notifications</h2>
        <p className="text-sm text-text-muted text-center max-w-sm mb-6">
          Connect an Android device to sync and manage your phone notifications
        </p>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-surface/40 border border-border text-text-muted">
          <Smartphone className="w-4 h-4" />
          <span className="text-sm">No device connected</span>
        </div>
      </div>
    );
  }

  const filteredNotifications = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.app.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Group by app
  const grouped = filteredNotifications.reduce<Record<string, Notification[]>>((acc, n) => {
    if (!acc[n.app]) acc[n.app] = [];
    acc[n.app].push(n);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Notifications</h1>
            <p className="text-sm text-text-secondary mt-1">
              {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''} from your phone
            </p>
          </div>

          {/* Auto-sync toggle */}
          <button
            onClick={() => setAutoSync(!autoSync)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-surface/60 border border-border text-sm transition-colors duration-200 cursor-pointer hover:bg-bg-hover"
          >
            {autoSync ? (
              <ToggleRight className="w-5 h-5 text-accent-light" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-text-muted" />
            )}
            <span className={autoSync ? 'text-text-primary' : 'text-text-muted'}>
              Auto-sync
            </span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-surface/60 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
            />
          </div>
          <button className="p-2.5 rounded-xl bg-bg-surface/60 border border-border text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors duration-200 cursor-pointer">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Notification Groups */}
        {Object.keys(grouped).length === 0 ? (
          <div className="glass rounded-2xl p-12 flex flex-col items-center text-center">
            <BellOff className="w-12 h-12 text-text-muted/30 mb-4" strokeWidth={1} />
            <h3 className="text-base font-semibold text-text-secondary mb-2">
              No notifications
            </h3>
            <p className="text-sm text-text-muted">
              {searchQuery ? 'No notifications match your search' : 'All caught up! No new notifications.'}
            </p>
          </div>
        ) : (
          Object.entries(grouped).map(([app, notifs]) => {
            const AppIcon = notifs[0].appIcon;
            const appColor = notifs[0].color;

            return (
              <div key={app} className="space-y-2 animate-slide-in">
                {/* App header */}
                <div className="flex items-center gap-2 px-1">
                  <AppIcon className={`w-4 h-4 ${appColor}`} />
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    {app}
                  </span>
                  <span className="text-[11px] text-text-muted">({notifs.length})</span>
                </div>

                {/* Notification cards */}
                <div className="space-y-2">
                  {notifs.map((notif) => (
                    <div
                      key={notif.id}
                      className="glass gradient-border rounded-xl p-4 hover:bg-bg-hover/30 transition-all duration-200 group"
                    >
                      <div className="flex items-start gap-3">
                        {/* App icon placeholder */}
                        <div className={`w-9 h-9 rounded-lg bg-bg-surface border border-border flex items-center justify-center flex-shrink-0`}>
                          <notif.appIcon className={`w-4 h-4 ${notif.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-text-primary truncate">
                              {notif.title}
                            </h4>
                            <span className="text-[11px] text-text-muted flex-shrink-0">
                              {notif.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                            {notif.body}
                          </p>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {notif.isMessaging && (
                              <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 text-accent-light text-[11px] font-medium hover:bg-accent/20 transition-colors cursor-pointer">
                                <Reply className="w-3 h-3" />
                                Reply
                              </button>
                            )}
                            <button
                              onClick={() => handleDismiss(notif.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-surface text-text-muted text-[11px] font-medium hover:bg-danger-muted hover:text-danger transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
