import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen, File, Image, Film, Music, FileText, Archive,
  ChevronRight, Home, RefreshCw, FolderUp, Grid, List,
  Trash2, Download, CheckSquare, Square, X, Search
} from 'lucide-react';
import { useDeviceStore } from '../stores/deviceStore';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { startDrag } from '@crabnebula/tauri-plugin-drag';
import MediaViewer from './MediaViewer';

interface FileItem {
  name: string;
  size?: number;
  is_dir: boolean;
  modified?: number;
}

const fileIcons: Record<string, typeof File> = {
  folder: FolderOpen,
  image: Image,
  video: Film,
  audio: Music,
  document: FileText,
  archive: Archive,
  file: File,
};

const fileColors: Record<string, string> = {
  folder: 'text-accent-light',
  image: 'text-emerald-400',
  video: 'text-purple-400',
  audio: 'text-pink-400',
  document: 'text-blue-400',
  archive: 'text-amber-400',
  file: 'text-text-muted',
};

function getFileType(name: string, isDir: boolean) {
  if (isDir) return 'folder';
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return 'image';
  if (['mp4', 'mkv', 'avi', 'mov'].includes(ext || '')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) return 'audio';
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return 'document';
  if (['zip', 'rar', 'tar', 'gz'].includes(ext || '')) return 'archive';
  return 'file';
}

function formatSize(bytes?: number) {
  if (bytes === undefined) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

export default function FileManager() {
  const { connectionState } = useDeviceStore();
  const isConnected = connectionState === 'connected';
  
  const [currentPath, setCurrentPath] = useState('/sdcard');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [downloadingFiles, setDownloadingFiles] = useState<Record<string, { size: number, received: number, id: string }>>({});
  const [draggingOutFile, setDraggingOutFile] = useState<string | null>(null);
  
  // Hover Thumbnail State
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [hoverImage, setHoverImage] = useState<{ path: string, x: number, y: number } | null>(null);
  const hoverTimeout = useRef<any>(null);

  // In-app media viewer state
  const [previewFile, setPreviewFile] = useState<{ path: string, name: string } | null>(null);

  const currentPathRef = useRef(currentPath);
  useEffect(() => {
    currentPathRef.current = currentPath;
    setSelectedFiles(new Set()); // Clear selection on navigate
  }, [currentPath]);

  const loadDirectory = async (path: string) => {
    setIsLoading(true);
    setCurrentPath(path);
    currentPathRef.current = path; // Update ref synchronously to catch fast WebSocket responses
    try {
      await invoke('request_android_files', { path });
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isConnected) {
      loadDirectory('/sdcard');
    }
  }, [isConnected]);

  // WebSocket listeners
  useEffect(() => {
    if (!isConnected) return;

    let unlistens: UnlistenFn[] = [];

    listen('dir_list', (event: any) => {
      const payload = event.payload;
      if (payload.path === currentPathRef.current) {
        const sortedFiles = (payload.files || []).sort((a: FileItem, b: FileItem) => {
          if (a.is_dir && !b.is_dir) return -1;
          if (!a.is_dir && b.is_dir) return 1;
          return a.name.localeCompare(b.name);
        });
        setFiles(sortedFiles);
        setIsLoading(false);

        // Progressively load thumbnails for all media files
        const mediaFiles = sortedFiles.filter(f => {
          const type = getFileType(f.name, f.is_dir);
          return type === 'image' || type === 'video';
        });
        
        mediaFiles.forEach((file, index) => {
          const fullPath = payload.path === '/' ? `/${file.name}` : `${payload.path}/${file.name}`;
          setTimeout(() => {
            invoke('request_thumbnail', { path: fullPath, reqId: fullPath }).catch(console.error);
          }, index * 50); // Stagger by 50ms to prevent overloading the bridge
        });
      }
    }).then(fn => unlistens.push(fn));

    listen('dir_list_refresh_needed', () => {
      loadDirectory(currentPathRef.current);
    }).then(fn => unlistens.push(fn));

    listen('file_transfer_start', (event: any) => {
      const { path, size, transfer_id } = event.payload;
      setDownloadingFiles(prev => ({ ...prev, [path]: { size, received: 0, id: transfer_id } }));
    }).then(fn => unlistens.push(fn));

    listen('file_transfer_progress', (event: any) => {
      const { transfer_id, bytes_received } = event.payload;
      setDownloadingFiles(prev => {
        const newState = { ...prev };
        for (const path in newState) {
          if (newState[path].id === transfer_id) {
            newState[path].received += bytes_received;
          }
        }
        return newState;
      });
    }).then(fn => unlistens.push(fn));

    listen('file_transfer_complete', (event: any) => {
      const { transfer_id } = event.payload;
      setDownloadingFiles(prev => {
        const newState = { ...prev };
        for (const path in newState) {
          if (newState[path].id === transfer_id) {
            delete newState[path];
          }
        }
        return newState;
      });
    }).then(fn => unlistens.push(fn));

    listen('thumbnail_data', (event: any) => {
      const { path, data } = event.payload;
      setThumbnails(prev => ({ ...prev, [path]: `data:image/jpeg;base64,${data}` }));
    }).then(fn => unlistens.push(fn));

    listen('file_preview_ready', (event: any) => {
      const { path, name } = event.payload;
      setPreviewFile({ path, name });
    }).then(fn => unlistens.push(fn));

    listen('write_success', (event: any) => {
      console.log('[Bifrost] Upload complete, refreshing folder...', event.payload);
      loadDirectory(currentPathRef.current);
    }).then(fn => unlistens.push(fn));

    listen('file_drag_ready', async (event: any) => {
      const { path, name } = event.payload;
      
      // If the user released the mouse before the download finished, do not start the drag.
      if (!isDragActive.current) {
        console.log('[Bifrost] Download finished, but drag was cancelled by user release.');
        return;
      }
      
      setDraggingOutFile(null);
      try {
        await startDrag({
          item: [path],
          icon: ""
        });
      } catch (e) {
        console.error("Drag failed:", e);
      }
    }).then(fn => unlistens.push(fn));

    getCurrentWebview().onDragDropEvent((event) => {
      console.log('[Bifrost DnD] Event received:', event.payload.type, event.payload);
      if (event.payload.type === 'drop') {
        const droppedFiles = event.payload.paths as string[];
        console.log('[Bifrost DnD] Files dropped:', droppedFiles);
        for (const file of droppedFiles) {
          const fileName = file.split(/[/\\]/).pop() || 'upload';
          const remotePath = currentPathRef.current === '/' ? `/${fileName}` : `${currentPathRef.current}/${fileName}`;
          console.log('[Bifrost DnD] Uploading:', file, '->', remotePath);
          invoke('upload_file_to_android', { localPath: file, remotePath: remotePath });
        }
      }
    }).then(fn => unlistens.push(fn));

    return () => {
      unlistens.forEach(fn => fn());
    };
  }, [isConnected]);

  const navigateUp = () => {
    if (currentPath === '/sdcard' || currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    loadDirectory('/' + parts.join('/'));
  };

  const handleFileClick = (file: FileItem) => {
    const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
    if (file.is_dir) {
      loadDirectory(fullPath);
    } else {
      invoke('download_and_open_file', { path: fullPath, intent: 'preview' });
    }
  };

  const handleMouseEnter = (e: React.MouseEvent, file: FileItem) => {
    const type = getFileType(file.name, file.is_dir);
    if (type === 'image' || type === 'video') {
      const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      
      // If we don't have the thumbnail yet, request it
      if (!thumbnails[fullPath]) {
        invoke('request_thumbnail', { path: fullPath, reqId: fullPath }).catch(console.error);
      }

      // Show the pop-out preview
      hoverTimeout.current = setTimeout(() => {
        setHoverImage({ path: fullPath, x: e.clientX, y: e.clientY });
      }, 300);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hoverImage) {
      setHoverImage(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setHoverImage(null);
  };

  const toggleSelection = (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(fileName)) next.delete(fileName);
      else next.add(fileName);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const paths = Array.from(selectedFiles).map(name => 
      currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
    );
    if (confirm(`Are you sure you want to permanently delete ${paths.length} items?`)) {
      invoke('delete_android_files', { paths });
      setSelectedFiles(new Set());
    }
  };

  const handleDownloadSelected = () => {
    const paths = Array.from(selectedFiles).map(name => 
      currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
    );
    paths.forEach(path => {
      invoke('download_and_open_file', { path, intent: 'save' });
    });
    setSelectedFiles(new Set());
  };

  // Ref to track if we should still start the drag when the download finishes
  const isDragActive = useRef(false);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragActive.current) {
        console.log('[Bifrost] Mouse released before download finished, canceling drag-out.');
        isDragActive.current = false;
        setDraggingOutFile(null);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Update global cursor when downloading a file for drag-out
  useEffect(() => {
    if (draggingOutFile) {
      document.body.style.cursor = 'progress';
    } else {
      document.body.style.cursor = 'default';
    }
    return () => { document.body.style.cursor = 'default'; };
  }, [draggingOutFile]);

  const handleDragStart = (e: React.DragEvent, file: FileItem) => {
    e.preventDefault();
    if (file.is_dir) return;
    if (draggingOutFile === file.name) return;
    
    isDragActive.current = true;
    setDraggingOutFile(file.name);
    const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
    invoke('download_and_open_file', { path: fullPath, intent: 'drag' }).catch(console.error);
  };

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-32 h-32 rounded-3xl bg-bg-surface/60 border border-border flex items-center justify-center mb-6">
          <FolderOpen className="w-14 h-14 text-text-muted/30" strokeWidth={1} />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">File Manager</h2>
        <p className="text-sm text-text-muted text-center max-w-sm mb-6">
          Connect an Android device to browse and transfer files wirelessly.
        </p>
      </div>
    );
  }

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <>
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-fade-in bg-bg-base relative" onMouseMove={handleMouseMove}>
      
      {/* Floating Pop-out Preview */}
      {hoverImage && thumbnails[hoverImage.path] && (
        <div 
          className="fixed z-50 pointer-events-none rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-bg-surface/80 backdrop-blur-xl transition-opacity duration-200"
          style={{ 
            right: window.innerWidth - hoverImage.x + 20, 
            bottom: window.innerHeight - hoverImage.y + 20,
            maxWidth: '350px',
            maxHeight: '350px'
          }}
        >
          <img src={thumbnails[hoverImage.path]} alt="Preview" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Dropzone Overlay */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Files</h1>
          <p className="text-sm text-text-secondary mt-1">Drag & drop to upload files to {breadcrumbs[breadcrumbs.length - 1] || 'Internal Storage'}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-bg-surface border border-border rounded-lg p-1">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-bg-hover text-accent-light' : 'text-text-muted hover:text-text-primary'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-bg-hover text-accent-light' : 'text-text-muted hover:text-text-primary'}`}>
              <Grid className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => loadDirectory(currentPath)} className="p-2 rounded-lg bg-bg-surface border border-border text-text-secondary hover:text-text-primary transition">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 mx-6 mb-6 gap-4">
        
        {/* Left Sidebar Categories */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-1">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-2">Locations</div>
          
          <button onClick={() => loadDirectory('/sdcard')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${currentPath === '/sdcard' ? 'bg-accent/10 text-accent-light font-medium' : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'}`}>
            <Home className="w-5 h-5" /> Internal Storage
          </button>
          <button onClick={() => loadDirectory('/sdcard/DCIM/Camera')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${currentPath === '/sdcard/DCIM/Camera' ? 'bg-accent/10 text-accent-light font-medium' : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'}`}>
            <Image className="w-5 h-5 text-emerald-400" /> Camera Roll
          </button>
          <button onClick={() => loadDirectory('/sdcard/Pictures')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${currentPath === '/sdcard/Pictures' ? 'bg-accent/10 text-accent-light font-medium' : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'}`}>
            <FolderOpen className="w-5 h-5 text-emerald-400" /> Pictures
          </button>
          <button onClick={() => loadDirectory('/sdcard/Movies')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${currentPath === '/sdcard/Movies' ? 'bg-accent/10 text-accent-light font-medium' : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'}`}>
            <Film className="w-5 h-5 text-purple-400" /> Videos
          </button>
          <button onClick={() => loadDirectory('/sdcard/Download')} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${currentPath === '/sdcard/Download' ? 'bg-accent/10 text-accent-light font-medium' : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'}`}>
            <Download className="w-5 h-5 text-blue-400" /> Downloads
          </button>
        </div>

        {/* Right Main Content Pane */}
        <div className="flex-1 glass rounded-2xl border border-border flex flex-col min-w-0 overflow-hidden relative">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border/50 bg-bg-surface/30 text-sm text-text-secondary">
            <button onClick={() => loadDirectory('/sdcard')} className="hover:text-accent-light transition flex items-center gap-1">
              <span className="font-medium text-text-primary">sdcard</span>
            </button>
            {breadcrumbs.map((crumb, idx) => {
              if (crumb === 'sdcard' && idx === 0) return null;
              const path = '/' + breadcrumbs.slice(0, idx + 1).join('/');
              return (
                <div key={path} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-text-muted" />
                  <button onClick={() => loadDirectory(path)} className="hover:text-accent-light transition font-medium text-text-primary">
                    {crumb}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Action Bar Overlay */}
          <div className={`absolute top-0 left-0 right-0 z-20 bg-accent/10 backdrop-blur-xl border-b border-accent/20 px-5 py-3 flex items-center justify-between transition-transform duration-300 ${selectedFiles.size > 0 ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="flex items-center gap-3 text-accent-light font-medium">
              <button onClick={() => setSelectedFiles(new Set())} className="hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
              <span>{selectedFiles.size} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDownloadSelected} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-surface/80 text-text-primary hover:bg-bg-hover transition text-sm font-medium border border-border/50">
                <Download className="w-4 h-4" /> Download
              </button>
              <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm font-medium border border-red-500/20">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>

          {/* File Grid/List */}
          <div className="flex-1 overflow-y-auto relative p-4">
            {isLoading && files.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-accent animate-spin" />
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "flex flex-col gap-1"}>
                
                {/* Go Up Directory Item */}
                {currentPath !== '/sdcard' && currentPath !== '/' && (
                  <button onClick={navigateUp} className={`w-full flex items-center gap-3 rounded-xl text-left hover:bg-bg-surface transition-colors ${viewMode === 'grid' ? 'p-4 flex-col justify-center text-center border border-transparent hover:border-border' : 'px-4 py-3'}`}>
                    <FolderUp className="w-6 h-6 text-accent-light" />
                    <span className="text-sm text-text-primary font-medium">..</span>
                  </button>
                )}

                {/* Actual Files */}
                {files.map((file) => {
                  const type = getFileType(file.name, file.is_dir);
                  const Icon = fileIcons[type] || File;
                  const color = fileColors[type] || 'text-text-muted';
                  
                  const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
                  const downloading = downloadingFiles[fullPath];
                  const progress = downloading ? Math.min((downloading.received / downloading.size) * 100, 100) : 0;
                  const isSelected = selectedFiles.has(file.name);

                  if (viewMode === 'grid') {
                    return (
                      <button
                        key={file.name}
                        draggable={!file.is_dir}
                        onDragStart={(e) => handleDragStart(e, file)}
                        onClick={() => handleFileClick(file)}
                        onMouseEnter={(e) => handleMouseEnter(e, file)}
                        onMouseLeave={handleMouseLeave}
                        className={`group relative flex flex-col items-center justify-center p-4 rounded-xl text-center transition-all duration-200 border ${isSelected ? 'bg-accent/10 border-accent/30' : 'bg-bg-surface/30 border-border hover:bg-bg-surface hover:border-border/80'}`}
                      >
                        <div 
                          className={`absolute top-2 left-2 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                          onClick={(e) => toggleSelection(e, file.name)}
                        >
                          {isSelected ? <CheckSquare className="w-5 h-5 text-accent-light" /> : <Square className="w-5 h-5 text-text-muted" />}
                        </div>
                        
                        {downloading && <div className="absolute inset-0 bg-accent/5 opacity-50 rounded-xl" />}
                        {draggingOutFile === file.name && (
                          <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center z-20">
                            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        
                        <div className="w-12 h-12 rounded-2xl bg-bg-base/50 flex items-center justify-center mb-3 overflow-hidden">
                          {thumbnails[fullPath] ? (
                            <img src={thumbnails[fullPath]} alt={file.name} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            <Icon className={`w-6 h-6 ${color} ${downloading ? 'animate-pulse' : ''}`} />
                          )}
                        </div>
                        <span className="text-sm text-text-primary font-medium truncate w-full group-hover:text-accent-light transition-colors">
                          {file.name}
                        </span>
                        
                        {!file.is_dir && downloading ? (
                          <div className="w-full mt-2 h-1.5 bg-bg-base rounded-full overflow-hidden">
                            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                        ) : !file.is_dir && (
                          <span className="text-xs text-text-muted mt-1">{formatSize(file.size)}</span>
                        )}
                      </button>
                    );
                  }

                  // List View
                  return (
                    <button
                      key={file.name}
                      draggable={!file.is_dir}
                      onDragStart={(e) => handleDragStart(e, file)}
                      onClick={() => handleFileClick(file)}
                      onMouseEnter={(e) => handleMouseEnter(e, file)}
                      onMouseLeave={handleMouseLeave}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors group cursor-pointer relative overflow-hidden ${isSelected ? 'bg-accent/10' : 'hover:bg-bg-surface'}`}
                    >
                      <div 
                        className={`transition-opacity mr-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        onClick={(e) => toggleSelection(e, file.name)}
                      >
                        {isSelected ? <CheckSquare className="w-5 h-5 text-accent-light" /> : <Square className="w-5 h-5 text-text-muted" />}
                      </div>

                      {downloading && <div className="absolute inset-0 bg-accent/5 opacity-50" />}
                      {draggingOutFile === file.name && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
                          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                      
                      {thumbnails[fullPath] ? (
                        <img src={thumbnails[fullPath]} alt={file.name} className="w-5 h-5 object-cover rounded flex-shrink-0" />
                      ) : (
                        <Icon className={`w-5 h-5 flex-shrink-0 ${color} ${downloading ? 'animate-pulse' : ''}`} />
                      )}
                      
                      <span className="flex-1 text-sm text-text-primary truncate font-medium group-hover:text-accent-light transition-colors relative z-10">
                        {file.name}
                      </span>
                      
                      {!file.is_dir && downloading ? (
                        <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
                          <span className="text-[11px] text-accent font-medium">{Math.round(progress)}%</span>
                          <div className="w-16 h-1.5 bg-bg-base rounded-full overflow-hidden">
                            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      ) : !file.is_dir && (
                        <span className="text-xs text-text-muted flex-shrink-0 relative z-10">
                          {formatSize(file.size)}
                        </span>
                      )}
                    </button>
                  );
                })}

                {files.length === 0 && !isLoading && (
                  <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                    <Search className="w-12 h-12 text-text-muted mb-4" />
                    <p className="text-text-muted text-sm font-medium">This folder is empty.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* In-app Media Viewer */}
    {previewFile && (
      <MediaViewer
        filePath={previewFile.path}
        fileName={previewFile.name}
        onClose={() => setPreviewFile(null)}
      />
    )}
    </>
  );
}
