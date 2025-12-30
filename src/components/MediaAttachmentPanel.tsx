import React, { useState } from 'react';
import { Camera, Mic, Video, X, Image, Play, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import type { MediaItem } from '../types';
import CameraCapture from './media/CameraCapture';
import AudioCapture from './media/AudioCapture';
import VideoCapture from './media/VideoCapture';

interface MediaAttachmentPanelProps {
  media: MediaItem[];
  onMediaChange: (media: MediaItem[]) => void;
  maxItems?: number;
}

export default function MediaAttachmentPanel({
  media,
  onMediaChange,
  maxItems = 10,
}: MediaAttachmentPanelProps) {
  const [showCapture, setShowCapture] = useState(false);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video' | 'audio'>('photo');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCapture = (dataUrl: string) => {
    const newMedia: MediaItem = {
      id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: captureMode === 'photo' ? 'PHOTO' : captureMode === 'video' ? 'VIDEO' : 'AUDIO',
      dataUrl,
      createdAt: new Date().toISOString(),
    };
    onMediaChange([...media, newMedia]);
    setShowCapture(false);
  };

  const removeMedia = (mediaId: string) => {
    onMediaChange(media.filter((m) => m.id !== mediaId));
  };

  const startCapture = (mode: 'photo' | 'video' | 'audio') => {
    setCaptureMode(mode);
    setShowCapture(true);
    setIsCollapsed(false);
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-2">
          <Camera size={18} className="text-cyan-400" />
          <span className="font-semibold text-white text-sm">
            Media Attachments {media.length > 0 && `(${media.length})`}
          </span>
        </div>
        {isCollapsed ? (
          <ChevronDown size={18} className="text-white/60" />
        ) : (
          <ChevronUp size={18} className="text-white/60" />
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 pt-0 space-y-3">
          {/* Capture Buttons */}
          {!showCapture && media.length < maxItems && (
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => startCapture('photo')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition group"
              >
                <Camera size={20} className="text-cyan-400 group-hover:scale-110 transition" />
                <span className="text-xs font-semibold text-white">Photo</span>
              </button>
              <button
                onClick={() => startCapture('video')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition group"
              >
                <Video size={20} className="text-purple-400 group-hover:scale-110 transition" />
                <span className="text-xs font-semibold text-white">Video</span>
              </button>
              <button
                onClick={() => startCapture('audio')}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 transition group"
              >
                <Mic size={20} className="text-pink-400 group-hover:scale-110 transition" />
                <span className="text-xs font-semibold text-white">Audio</span>
              </button>
            </div>
          )}

          {/* Capture Interface */}
          {showCapture && (
            <div className="relative">
              <button
                onClick={() => setShowCapture(false)}
                className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              >
                <X size={18} />
              </button>
              {captureMode === 'photo' && (
                <CameraCapture
                  onCapture={handleCapture}
                  onCancel={() => setShowCapture(false)}
                />
              )}
              {captureMode === 'video' && (
                <VideoCapture
                  onCapture={handleCapture}
                  onCancel={() => setShowCapture(false)}
                />
              )}
              {captureMode === 'audio' && (
                <AudioCapture
                  onCapture={handleCapture}
                  onCancel={() => setShowCapture(false)}
                />
              )}
            </div>
          )}

          {/* Media Grid */}
          {media.length > 0 && (
            <div>
              <p className="text-xs text-white/50 mb-2 font-semibold">
                Attached Media ({media.length}/{maxItems})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {media.map((item) => (
                  <div key={item.id} className="relative group">
                    {/* Photo */}
                    {item.type === 'PHOTO' && (
                      <div className="relative">
                        <img
                          src={item.dataUrl || item.url}
                          alt="Attachment"
                          className="w-full h-24 object-cover rounded-xl border border-white/15"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition flex items-center justify-center">
                          <Image
                            size={20}
                            className="text-white opacity-0 group-hover:opacity-100 transition"
                          />
                        </div>
                      </div>
                    )}

                    {/* Video */}
                    {item.type === 'VIDEO' && (
                      <div className="relative">
                        <video
                          src={item.dataUrl || item.url}
                          className="w-full h-24 object-cover rounded-xl border border-white/15"
                        />
                        <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center">
                          <Play size={20} className="text-white drop-shadow-lg" />
                        </div>
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                          VIDEO
                        </div>
                      </div>
                    )}

                    {/* Audio */}
                    {item.type === 'AUDIO' && (
                      <div className="w-full h-24 rounded-xl border border-white/15 bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex flex-col items-center justify-center gap-1">
                        <Volume2 size={24} className="text-pink-400" />
                        <span className="text-[10px] font-bold text-pink-300">AUDIO</span>
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => removeMedia(item.id)}
                      className="absolute top-1 right-1 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition shadow-lg"
                    >
                      <X size={12} />
                    </button>

                    {/* Timestamp */}
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {media.length === 0 && !showCapture && (
            <div className="text-center py-6 text-white/40">
              <Camera size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-xs">No media attached</p>
              <p className="text-[10px] mt-1">Add photos, videos, or audio notes</p>
            </div>
          )}

          {/* Limit Warning */}
          {media.length >= maxItems && (
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-amber-300 text-center">
                Media limit reached ({maxItems} max)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
