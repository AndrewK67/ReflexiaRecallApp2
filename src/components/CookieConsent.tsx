import React, { useState, useEffect } from 'react';
import { Cookie, X, Settings } from 'lucide-react';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always required
    analytics: false,
    advertising: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
        applyCookiePreferences(saved);
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const applyCookiePreferences = (prefs: typeof preferences) => {
    // Enable/disable analytics
    if (prefs.analytics) {
      // Initialize Google Analytics
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
        });
      }
    } else {
      // Disable analytics
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
        });
      }
    }

    // Enable/disable advertising
    if (prefs.advertising) {
      // Initialize advertising (Google AdSense)
      if (window.adsbygoogle) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({
            google_ad_client: 'ca-pub-YOUR_ADSENSE_ID',
            enable_page_level_ads: true,
          });
        } catch (e) {
          console.error('AdSense initialization error:', e);
        }
      }
    }
  };

  const acceptAll = () => {
    const prefs = {
      essential: true,
      analytics: true,
      advertising: true,
    };
    setPreferences(prefs);
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    applyCookiePreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptEssential = () => {
    const prefs = {
      essential: true,
      analytics: false,
      advertising: false,
    };
    setPreferences(prefs);
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    applyCookiePreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
  };

  const saveCustomPreferences = () => {
    localStorage.setItem('cookieConsent', JSON.stringify(preferences));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    applyCookiePreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/20 p-4 z-50 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="max-w-6xl mx-auto">
          {!showSettings ? (
            // Simple Banner
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie size={24} className="text-cyan-400 flex-shrink-0" />
                <div className="text-sm text-white">
                  <p className="font-semibold mb-1">We use cookies</p>
                  <p className="text-white/60">
                    We use cookies for analytics and advertising.
                    <a href="/privacy-policy" className="underline ml-1 hover:text-cyan-400">Learn more</a>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/15 transition flex items-center gap-2"
                >
                  <Settings size={16} />
                  Customize
                </button>
                <button
                  onClick={acceptEssential}
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/15 transition"
                >
                  Essential Only
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-2 rounded-xl bg-cyan-500 text-white text-sm font-bold hover:bg-cyan-600 transition"
                >
                  Accept All
                </button>
              </div>
            </div>
          ) : (
            // Settings Panel
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings size={20} />
                  Cookie Preferences
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">Essential Cookies</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                        Always Active
                      </span>
                    </div>
                    <p className="text-xs text-white/60">
                      Required for the app to function. Stores your reflections, preferences, and settings locally.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="mt-1"
                  />
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">Analytics Cookies</span>
                    </div>
                    <p className="text-xs text-white/60">
                      Help us understand how you use the app so we can improve it. Google Analytics.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                {/* Advertising Cookies */}
                <div className="flex items-start justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold text-sm">Advertising Cookies</span>
                    </div>
                    <p className="text-xs text-white/60">
                      Used to show relevant ads that support our free tier. Google AdSense.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={preferences.advertising}
                      onChange={(e) => setPreferences({ ...preferences, advertising: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={saveCustomPreferences}
                  className="flex-1 px-6 py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-600 transition"
                >
                  Save Preferences
                </button>
                <button
                  onClick={acceptAll}
                  className="px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 transition"
                >
                  Accept All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// TypeScript declarations for global objects
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    adsbygoogle?: any[];
  }
}
