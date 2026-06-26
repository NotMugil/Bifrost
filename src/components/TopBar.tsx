import {
  Wifi,
  Usb,
  Battery,
  BatteryCharging,
  Search,
  Signal,
} from 'lucide-react';
import { useDeviceStore } from '../stores/deviceStore';

const connectionStateLabels: Record<string, { label: string; color: string; dotColor: string }> = {
  disconnected: { label: 'Disconnected', color: 'text-text-muted', dotColor: 'bg-text-muted' },
  discovering: { label: 'Discovering…', color: 'text-warning', dotColor: 'bg-warning' },
  pairing: { label: 'Pairing…', color: 'text-accent-light', dotColor: 'bg-accent' },
  connecting: { label: 'Connecting…', color: 'text-accent-light', dotColor: 'bg-accent' },
  connected: { label: 'Connected', color: 'text-success', dotColor: 'bg-success' },
  reconnecting: { label: 'Reconnecting…', color: 'text-warning', dotColor: 'bg-warning' },
};

export default function TopBar() {
  const { connectedDevice, connectionState } = useDeviceStore();
  const stateInfo = connectionStateLabels[connectionState];

  return (
    <header className="flex items-center justify-between h-14 px-5 bg-bg-secondary/50 backdrop-blur-xl border-b border-border">
      {/* Left: Device info */}
      <div className="flex items-center gap-4">
        {/* Connection state badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface/60 border border-border">
          <span className={`w-2 h-2 rounded-full ${stateInfo.dotColor} ${
            connectionState !== 'disconnected' && connectionState !== 'connected' ? 'animate-pulse' : ''
          }`} />
          <span className={`text-xs font-medium ${stateInfo.color}`}>
            {stateInfo.label}
          </span>
        </div>

        {/* Device info */}
        {connectedDevice && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-px h-6 bg-border" />

            {/* Connection type icon */}
            <div className="flex items-center gap-1.5 text-text-secondary">
              {connectedDevice.connectionType === 'wifi' ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <Usb className="w-3.5 h-3.5" />
              )}
              <span className="text-xs font-medium uppercase tracking-wider">
                {connectedDevice.connectionType}
              </span>
            </div>

            <div className="w-px h-6 bg-border" />

            {/* Device name & model */}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-text-primary leading-tight">
                {connectedDevice.name}
              </span>
              <span className="text-[11px] text-text-muted leading-tight">
                {connectedDevice.model}
              </span>
            </div>

            {/* Battery */}
            {connectedDevice.batteryLevel !== undefined && (
              <>
                <div className="w-px h-6 bg-border" />
                <div className="flex items-center gap-1.5">
                  {connectedDevice.batteryLevel > 20 ? (
                    <Battery className={`w-4 h-4 ${
                      connectedDevice.batteryLevel > 60 ? 'text-success' :
                      connectedDevice.batteryLevel > 20 ? 'text-warning' : 'text-danger'
                    }`} />
                  ) : (
                    <BatteryCharging className="w-4 h-4 text-danger" />
                  )}
                  <span className="text-xs font-medium text-text-secondary">
                    {connectedDevice.batteryLevel}%
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface/40 border border-border text-text-muted hover:text-text-secondary hover:border-border-hover transition-all duration-200 cursor-pointer">
          <Search className="w-3.5 h-3.5" />
          <span className="text-xs">Search</span>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-bg-primary/60 rounded border border-border text-text-muted">
            ⌘K
          </kbd>
        </button>

        {/* Signal quality */}
        {connectionState === 'connected' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-success-muted border border-success/20">
            <Signal className="w-3.5 h-3.5 text-success" />
            <span className="text-[11px] font-medium text-success">Good</span>
          </div>
        )}
      </div>
    </header>
  );
}
