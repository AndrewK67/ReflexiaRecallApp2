/**
 * UpdateNotification - Shows a banner when app update is available
 */

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function UpdateNotification() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[UpdateNotification] SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('[UpdateNotification] SW registration error:', error);
    },
  });

  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when a new update is available
  useEffect(() => {
    if (needRefresh) {
      setDismissed(false);
    }
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setNeedRefresh(false);
  };

  if (!needRefresh || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-2xl shadow-2xl border-2 border-cyan-400/50 p-4 flex items-center gap-3 min-w-[320px] max-w-md">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Download size={20} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="text-white font-bold text-sm">Update Available</div>
          <div className="text-white/80 text-xs">A new version of Reflexia is ready</div>
        </div>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 bg-white text-cyan-600 rounded-xl font-bold text-sm hover:bg-white/90 transition flex-shrink-0"
        >
          Update Now
        </button>
        <button
          onClick={handleDismiss}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition flex-shrink-0"
          aria-label="Dismiss"
        >
          <X size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}
