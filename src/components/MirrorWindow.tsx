import { useEffect, useRef } from 'react';
import JMuxer from 'jmuxer';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { X } from 'lucide-react';

export default function MirrorWindow() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const jmuxerRef = useRef<any>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    jmuxerRef.current = new JMuxer({
      node: videoRef.current,
      mode: 'video',
      flushingTime: 0,
      fps: 60,
      debug: false,
    });

    const ws = new WebSocket('ws://127.0.0.1:14211');
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      console.log('Connected to H.264 stream');
    };

    ws.onmessage = (event) => {
      if (jmuxerRef.current && event.data) {
        jmuxerRef.current.feed({
          video: new Uint8Array(event.data)
        });
      }
    };

    return () => {
      ws.close();
      if (jmuxerRef.current) {
        jmuxerRef.current.destroy();
      }
    };
  }, []);

  const closeWindow = async () => {
    try {
      const win = getCurrentWindow();
      await win.close();
    } catch (err) {
      console.error("Failed to close window:", err);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black group" data-tauri-drag-region>
      <video
        ref={videoRef}
        id="player"
        autoPlay
        muted
        className="w-full h-full object-contain rounded-2xl bg-black pointer-events-none"
      />
      
      {/* Hidden Control Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end items-start pointer-events-none" data-tauri-drag-region>
        <button
          onClick={closeWindow}
          className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors pointer-events-auto"
          title="Close Mirror"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
