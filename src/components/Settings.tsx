import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Wifi,
  Monitor,
  FolderOpen,
  Bell,
  ClipboardCopy,
  Palette,
  Info,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ExternalLink,
  Heart,
  Zap,
  Shield,
} from 'lucide-react';

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  label: string;
  description?: string;
}

function ToggleSwitch({ enabled, onToggle, label, description }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <span className="text-sm text-text-primary">{label}</span>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onToggle}
        className="cursor-pointer transition-colors duration-200"
      >
        {enabled ? (
          <ToggleRight className="w-8 h-8 text-accent-light" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-text-muted" />
        )}
      </button>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  description?: string;
}

function SelectField({ label, value, options, onChange, description }: SelectFieldProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <span className="text-sm text-text-primary">{label}</span>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none pl-3 pr-8 py-1.5 rounded-lg bg-bg-surface border border-border text-xs text-text-primary cursor-pointer focus:outline-none focus:border-accent/40"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  description?: string;
}

function TextField({ label, value, onChange, placeholder, description }: TextFieldProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <span className="text-sm text-text-primary">{label}</span>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-48 px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
      />
    </div>
  );
}

interface SettingsSectionProps {
  icon: typeof SettingsIcon;
  title: string;
  iconColor?: string;
  children: React.ReactNode;
}

function SettingsSection({ icon: Icon, title, iconColor = 'text-accent-light', children }: SettingsSectionProps) {
  return (
    <div className="glass gradient-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-bg-surface/20">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="px-5 divide-y divide-border/50">{children}</div>
    </div>
  );
}

export default function Settings() {
  // Connection settings
  const [defaultMode, setDefaultMode] = useState('Wi-Fi');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [wsPort, setWsPort] = useState('8765');

  // Mirroring settings
  const [mirrorRes, setMirrorRes] = useState('1080p');
  const [bitrate, setBitrate] = useState('8 Mbps');
  const [fps, setFps] = useState('60');

  // Transfer settings
  const [savePath, setSavePath] = useState('~/Downloads/Bifrost');
  const [autoAccept, setAutoAccept] = useState(false);

  // Notification settings
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [dnd, setDnd] = useState(false);

  // Clipboard settings
  const [clipSync, setClipSync] = useState(true);
  const [historyLimit, setHistoryLimit] = useState('50');

  // Appearance
  const [darkMode, setDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState('Indigo');

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Settings</h1>
          <p className="text-sm text-text-secondary mt-1">
            Configure Bifrost to your preferences
          </p>
        </div>

        {/* Connection */}
        <SettingsSection icon={Wifi} title="Connection">
          <SelectField
            label="Default Mode"
            value={defaultMode}
            options={['Wi-Fi', 'USB', 'Auto']}
            onChange={setDefaultMode}
            description="Preferred connection method"
          />
          <ToggleSwitch
            label="Auto-reconnect"
            description="Automatically reconnect when device is in range"
            enabled={autoReconnect}
            onToggle={() => setAutoReconnect(!autoReconnect)}
          />
          <TextField
            label="WebSocket Port"
            value={wsPort}
            onChange={setWsPort}
            placeholder="8765"
            description="Port for communication"
          />
        </SettingsSection>

        {/* Mirroring */}
        <SettingsSection icon={Monitor} title="Screen Mirroring" iconColor="text-accent-violet">
          <SelectField
            label="Default Resolution"
            value={mirrorRes}
            options={['720p', '1080p', '1440p', '4K']}
            onChange={setMirrorRes}
          />
          <SelectField
            label="Bitrate"
            value={bitrate}
            options={['4 Mbps', '8 Mbps', '12 Mbps', '16 Mbps']}
            onChange={setBitrate}
          />
          <SelectField
            label="Frame Rate"
            value={fps}
            options={['30', '60', '120']}
            onChange={setFps}
          />
        </SettingsSection>

        {/* File Transfers */}
        <SettingsSection icon={FolderOpen} title="File Transfers" iconColor="text-emerald-400">
          <TextField
            label="Save Location"
            value={savePath}
            onChange={setSavePath}
            placeholder="~/Downloads"
            description="Default directory for received files"
          />
          <ToggleSwitch
            label="Auto-accept Files"
            description="Automatically accept incoming file transfers"
            enabled={autoAccept}
            onToggle={() => setAutoAccept(!autoAccept)}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection icon={Bell} title="Notifications" iconColor="text-amber-400">
          <ToggleSwitch
            label="Enable Notifications"
            description="Show phone notifications on desktop"
            enabled={notifEnabled}
            onToggle={() => setNotifEnabled(!notifEnabled)}
          />
          <ToggleSwitch
            label="Do Not Disturb"
            description="Mute all notification sounds"
            enabled={dnd}
            onToggle={() => setDnd(!dnd)}
          />
        </SettingsSection>

        {/* Clipboard */}
        <SettingsSection icon={ClipboardCopy} title="Clipboard" iconColor="text-blue-400">
          <ToggleSwitch
            label="Auto-sync Clipboard"
            description="Automatically sync clipboard between devices"
            enabled={clipSync}
            onToggle={() => setClipSync(!clipSync)}
          />
          <SelectField
            label="History Limit"
            value={historyLimit}
            options={['25', '50', '100', '200']}
            onChange={setHistoryLimit}
            description="Maximum clipboard entries to keep"
          />
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection icon={Palette} title="Appearance" iconColor="text-pink-400">
          <ToggleSwitch
            label="Dark Mode"
            description="Use dark theme (recommended)"
            enabled={darkMode}
            onToggle={() => setDarkMode(!darkMode)}
          />
          <SelectField
            label="Accent Color"
            value={accentColor}
            options={['Indigo', 'Violet', 'Blue', 'Emerald', 'Rose']}
            onChange={setAccentColor}
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection icon={Info} title="About" iconColor="text-text-secondary">
          <div className="py-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center shadow-lg shadow-accent-glow/20">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Bifrost</h4>
                <p className="text-xs text-text-muted">Version 0.1.0-alpha</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              A bridge between your Android phone and Linux PC. Transfer files, mirror screens, sync notifications and clipboard — all seamlessly.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-xs text-text-secondary hover:text-text-primary hover:border-border-hover transition-all duration-200"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface border border-border text-xs text-text-muted">
                <Shield className="w-3.5 h-3.5" />
                MIT License
              </span>
            </div>

            <p className="text-[11px] text-text-muted mt-4 flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-danger" /> for the Linux community
            </p>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
