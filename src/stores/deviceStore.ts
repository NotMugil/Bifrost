import { create } from 'zustand';

export interface Device {
  id: string;
  name: string;
  model: string;
  connectionType: 'wifi' | 'usb';
  ipAddress?: string;
  isConnected: boolean;
  batteryLevel?: number;
}

export type ConnectionState =
  | 'disconnected'
  | 'discovering'
  | 'pairing'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

export type ActiveView =
  | 'devices'
  | 'mirror'
  | 'files'
  | 'notifications'
  | 'clipboard'
  | 'settings';

interface DeviceStore {
  devices: Device[];
  connectedDevice: Device | null;
  connectionState: ConnectionState;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setDevices: (devices: Device[]) => void;
  setConnectedDevice: (device: Device | null) => void;
  setConnectionState: (state: ConnectionState) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: [],
  connectedDevice: null,
  connectionState: 'disconnected',
  activeView: 'devices',
  setActiveView: (view) => set({ activeView: view }),
  setDevices: (devices) => set({ devices }),
  setConnectedDevice: (device) => set({ connectedDevice: device }),
  setConnectionState: (state) => set({ connectionState: state }),
}));
