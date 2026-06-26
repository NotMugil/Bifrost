import { useState, useEffect, useRef } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';

interface MediaViewerProps {
  filePath: string;
  fileName: string;
  onClose: () => void;
}

function getMediaType(name: string): 'image' | 'video' | 'unknown' {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  return 'unknown';
}

export default function MediaViewer({ filePath, fileName, onClose }: MediaViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mediaType = getMediaType(fileName);
  const assetUrl = convertFileSrc(filePath);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 5));
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.25));
      if (e.key === 'r') setRotation(r => r + 90);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Close when clicking the backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  // Handle scroll to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(z => Math.min(z + 0.1, 5));
    } else {
      setZoom(z => Math.max(z - 0.1, 0.25));
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 z-10 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center gap-3">
          <span className="text-white/90 text-sm font-medium truncate max-w-[400px]">
            {fileName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mediaType === 'image' && (
            <>
              <button
                onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                title="Zoom Out (−)"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-white/50 text-xs font-mono min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(z + 0.25, 5))}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setRotation(r => r + 90)}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                title="Rotate (R)"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <div className="w-px h-6 bg-white/20 mx-1" />
            </>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media content */}
      <div className="flex items-center justify-center w-full h-full overflow-hidden" onWheel={handleWheel}>
        {mediaType === 'image' && (
          <img
            src={assetUrl}
            alt={fileName}
            draggable={false}
            className="max-w-[90vw] max-h-[85vh] object-contain select-none transition-transform duration-200 ease-out"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
          />
        )}
        {mediaType === 'video' && (
          <video
            src={assetUrl}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[85vh] min-w-[300px] min-h-[200px] rounded-lg shadow-2xl"
            style={{ outline: 'none' }}
          />
        )}
        {mediaType === 'unknown' && (
          <div className="text-white/60 text-center">
            <p className="text-lg font-medium mb-2">Cannot preview this file type</p>
            <p className="text-sm">{fileName}</p>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-4 bg-gradient-to-t from-black/70 to-transparent">
        <span className="text-white/30 text-xs">
          {mediaType === 'image' ? 'Scroll to zoom · R to rotate · Esc to close' : 'Esc to close'}
        </span>
      </div>
    </div>
  );
}
