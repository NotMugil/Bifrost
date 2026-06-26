import { useState, useEffect } from 'react';
import {
  ClipboardCopy,
  Copy,
  Check,
  Smartphone,
  Monitor,
  ToggleLeft,
  ToggleRight,
  Clock,
  FileText,
  Link2,
  Image,
  Trash2,
} from 'lucide-react';
import { useDeviceStore } from '../stores/deviceStore';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

interface ClipboardEntry {
  id: string;
  content: string;
  type: 'text' | 'link' | 'image';
  source: 'phone' | 'pc';
  timestamp: string;
  isCurrent?: boolean;
}



const typeIcons = {
  text: FileText,
  link: Link2,
  image: Image,
};

const typeColors = {
  text: 'text-text-secondary',
  link: 'text-accent-light',
  image: 'text-emerald-400',
};

export default function ClipboardSync() {
  const { connectionState } = useDeviceStore();
  const isConnected = connectionState === 'connected';
  const [autoSync, setAutoSync] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [entries, setEntries] = useState<ClipboardEntry[]>([]);

  useEffect(() => {
    if (!isConnected) return;

    // Fetch initial desktop clipboard
    invoke<string>('get_desktop_clipboard').then((content) => {
      if (content) {
        setEntries([
          {
            id: Date.now().toString(),
            content,
            type: (content.startsWith('http') ? 'link' : 'text') as 'link' | 'text',
            source: 'pc' as 'pc',
            timestamp: 'Just now',
            isCurrent: true,
          },
        ]);
      }
    }).catch(console.error);

    const unlisten = listen('clipboard_update', (event: any) => {
      const content = event.payload.content;
      if (!content) return;
      
      setEntries((prev) => {
        // Remove current flag from others
        const updated = prev.map(e => ({ ...e, isCurrent: false }));
        // Add new entry at top
        return [
          {
            id: Date.now().toString(),
            content,
            type: (content.startsWith('http') ? 'link' : 'text') as 'link' | 'text',
            source: 'phone' as 'phone',
            timestamp: 'Just now',
            isCurrent: true,
          },
          ...updated,
        ].slice(0, 50); // Keep last 50
      });
      
      if (autoSync) {
        invoke('set_desktop_clipboard', { content }).catch(console.error);
      }
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, [isConnected, autoSync]);

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-32 h-32 rounded-3xl bg-bg-surface/60 border border-border flex items-center justify-center mb-6">
          <ClipboardCopy className="w-14 h-14 text-text-muted/30" strokeWidth={1} />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Clipboard Sync</h2>
        <p className="text-sm text-text-muted text-center max-w-sm mb-6">
          Connect an Android device to sync clipboard content between devices
        </p>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-surface/40 border border-border text-text-muted">
          <Smartphone className="w-4 h-4" />
          <span className="text-sm">No device connected</span>
        </div>
      </div>
    );
  }

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard?.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const currentEntry = entries.find((e) => e.isCurrent);

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Clipboard</h1>
            <p className="text-sm text-text-secondary mt-1">
              Synced clipboard history across devices
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

        {/* Current Clipboard */}
        {currentEntry && (
          <div className="glass gradient-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-accent-light uppercase tracking-wider flex items-center gap-1.5">
                <ClipboardCopy className="w-3.5 h-3.5" />
                Current Clipboard
              </span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-bg-surface text-[11px] text-text-muted">
                {currentEntry.source === 'phone' ? (
                  <Smartphone className="w-3 h-3" />
                ) : (
                  <Monitor className="w-3 h-3" />
                )}
                {currentEntry.source === 'phone' ? 'Phone' : 'PC'}
              </span>
            </div>
            <p className="text-sm text-text-primary bg-bg-primary/50 rounded-lg px-4 py-3 font-mono break-all">
              {currentEntry.content}
            </p>
          </div>
        )}

        {/* Clipboard History */}
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            History
          </h2>

          {entries.length === 0 ? (
            <div className="glass rounded-2xl p-12 flex flex-col items-center text-center">
              <ClipboardCopy className="w-12 h-12 text-text-muted/30 mb-4" strokeWidth={1} />
              <h3 className="text-base font-semibold text-text-secondary mb-2">
                Clipboard is empty
              </h3>
              <p className="text-sm text-text-muted">
                Copy something on either device to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const TypeIcon = typeIcons[entry.type];
                const typeColor = typeColors[entry.type];

                return (
                  <div
                    key={entry.id}
                    className={`glass rounded-xl p-4 hover:bg-bg-hover/30 transition-all duration-200 group ${
                      entry.isCurrent ? 'ring-1 ring-accent/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Timeline dot */}
                      <div className="flex flex-col items-center pt-1">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          entry.isCurrent ? 'bg-accent shadow-[0_0_6px_rgba(99,102,241,0.5)]' : 'bg-text-muted/40'
                        }`} />
                        <div className="w-px h-full bg-border/50 mt-1" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <TypeIcon className={`w-3.5 h-3.5 ${typeColor}`} />
                          <span className="text-[11px] text-text-muted">{entry.timestamp}</span>
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-bg-surface/80 text-[10px] text-text-muted">
                            {entry.source === 'phone' ? (
                              <Smartphone className="w-2.5 h-2.5" />
                            ) : (
                              <Monitor className="w-2.5 h-2.5" />
                            )}
                            {entry.source === 'phone' ? 'Phone' : 'PC'}
                          </span>
                        </div>

                        <p className="text-sm text-text-primary truncate">
                          {entry.content}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
                        <button
                          onClick={() => handleCopy(entry.id, entry.content)}
                          className="p-1.5 rounded-lg hover:bg-accent/10 text-text-muted hover:text-accent-light transition-colors cursor-pointer"
                          title="Copy"
                        >
                          {copiedId === entry.id ? (
                            <Check className="w-3.5 h-3.5 text-success" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 rounded-lg hover:bg-danger-muted text-text-muted hover:text-danger transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
