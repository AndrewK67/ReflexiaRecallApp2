/**
 * PermissionsHelp - Shows instructions for enabling camera and microphone permissions
 */

import { useState } from 'react';
import { Camera, Mic, AlertCircle, X, ChevronDown, ChevronUp, Smartphone, Globe } from 'lucide-react';

interface PermissionsHelpProps {
  onClose: () => void;
}

export default function PermissionsHelp({ onClose }: PermissionsHelpProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('safari-ios');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-y-auto custom-scrollbar nav-safe">
      <div className="animated-backdrop-dark overflow-hidden">
        <div className="orb one" />
        <div className="orb two" />
        <div className="orb three" />
        <div className="grain" />
      </div>

      {/* Header */}
      <div className="sticky top-0 bg-slate-900/80 backdrop-blur-xl border-b border-white/10 z-10 relative">
        <div className="flex items-center justify-between p-6">
          <h1 className="text-xl font-bold">Camera & Mic Permissions</h1>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6 pb-24 relative">
        <div className="max-w-2xl mx-auto">
          {/* Introduction */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-white mb-1">Need Help Enabling Permissions?</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Reflexia needs camera and microphone access to capture photos, videos, and audio notes.
                  Follow the instructions below for your device.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Test Section */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mb-6">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <Camera size={18} className="text-cyan-400" />
              Quick Permission Check
            </h3>
            <p className="text-sm text-white/70 mb-3">
              When you try to use the camera or microphone, your browser will show a permission prompt. Click "Allow" to enable access.
            </p>
            <div className="bg-white/10 rounded-xl p-3 border border-white/10">
              <p className="text-xs text-white/60 italic">
                If you accidentally clicked "Block" or "Deny", use the instructions below to re-enable permissions.
              </p>
            </div>
          </div>

          {/* iOS Safari */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('safari-ios')}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-cyan-400" />
                <div className="text-left">
                  <h3 className="font-bold text-white">iPhone / iPad (Safari)</h3>
                  <p className="text-xs text-white/60">iOS 15 or later</p>
                </div>
              </div>
              {expandedSection === 'safari-ios' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSection === 'safari-ios' && (
              <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
                <div>
                  <h4 className="font-semibold text-white mb-2 text-sm">Method 1: In-Browser</h4>
                  <ol className="space-y-2 text-sm text-white/80">
                    <li className="flex gap-2">
                      <span className="font-bold text-cyan-400">1.</span>
                      <span>Tap the <strong>AA</strong> icon in the address bar (top left)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-cyan-400">2.</span>
                      <span>Tap <strong>"Website Settings"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-cyan-400">3.</span>
                      <span>Under Camera and Microphone, tap <strong>"Allow"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-cyan-400">4.</span>
                      <span>Reload the page</span>
                    </li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2 text-sm">Method 2: iOS Settings</h4>
                  <ol className="space-y-2 text-sm text-white/80">
                    <li className="flex gap-2">
                      <span className="font-bold text-cyan-400">1.</span>
                      <span>Open <strong>Settings</strong> app on your iPhone</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-cyan-400">2.</span>
                      <span>Scroll down and tap <strong>Safari</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-cyan-400">3.</span>
                      <span>Tap <strong>Camera</strong> → Set to <strong>"Ask"</strong> or <strong>"Allow"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-cyan-400">4.</span>
                      <span>Tap <strong>Microphone</strong> → Set to <strong>"Ask"</strong> or <strong>"Allow"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-cyan-400">5.</span>
                      <span>Return to Reflexia and reload the page</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Android Chrome */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('chrome-android')}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-green-400" />
                <div className="text-left">
                  <h3 className="font-bold text-white">Android (Chrome)</h3>
                  <p className="text-xs text-white/60">Most Android phones</p>
                </div>
              </div>
              {expandedSection === 'chrome-android' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSection === 'chrome-android' && (
              <div className="px-5 pb-5 space-y-4 border-t border-white/10 pt-4">
                <div>
                  <h4 className="font-semibold text-white mb-2 text-sm">In-Browser Method</h4>
                  <ol className="space-y-2 text-sm text-white/80">
                    <li className="flex gap-2">
                      <span className="font-bold text-green-400">1.</span>
                      <span>Tap the <strong>lock icon</strong> 🔒 or <strong>info icon</strong> ⓘ in the address bar</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-green-400">2.</span>
                      <span>Tap <strong>"Permissions"</strong> or <strong>"Site Settings"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-green-400">3.</span>
                      <span>Find <strong>Camera</strong> and <strong>Microphone</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-green-400">4.</span>
                      <span>Change both to <strong>"Allow"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-green-400">5.</span>
                      <span>Reload the page</span>
                    </li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2 text-sm">Android Settings Method</h4>
                  <ol className="space-y-2 text-sm text-white/80">
                    <li className="flex gap-2">
                      <span className="font-bold text-green-400">1.</span>
                      <span>Open Android <strong>Settings</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-green-400">2.</span>
                      <span>Tap <strong>Apps</strong> → <strong>Chrome</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-green-400">3.</span>
                      <span>Tap <strong>Permissions</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-green-400">4.</span>
                      <span>Enable <strong>Camera</strong> and <strong>Microphone</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-green-400">5.</span>
                      <span>Return to Reflexia and reload</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Chrome */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('chrome-desktop')}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-blue-400" />
                <div className="text-left">
                  <h3 className="font-bold text-white">Desktop Chrome / Edge</h3>
                  <p className="text-xs text-white/60">Windows, Mac, Linux</p>
                </div>
              </div>
              {expandedSection === 'chrome-desktop' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSection === 'chrome-desktop' && (
              <div className="px-5 pb-5 border-t border-white/10 pt-4">
                <ol className="space-y-2 text-sm text-white/80">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-400">1.</span>
                    <span>Click the <strong>lock icon</strong> 🔒 in the address bar (left of URL)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-400">2.</span>
                    <span>Click <strong>"Site Settings"</strong> or <strong>"Permissions"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-400">3.</span>
                    <span>Find <strong>Camera</strong> and <strong>Microphone</strong> in the list</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-400">4.</span>
                    <span>Change dropdown from "Block" to <strong>"Allow"</strong> for both</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-400">5.</span>
                    <span>Reload the page (F5 or Ctrl+R / Cmd+R)</span>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Desktop Firefox */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('firefox-desktop')}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-orange-400" />
                <div className="text-left">
                  <h3 className="font-bold text-white">Desktop Firefox</h3>
                  <p className="text-xs text-white/60">Windows, Mac, Linux</p>
                </div>
              </div>
              {expandedSection === 'firefox-desktop' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSection === 'firefox-desktop' && (
              <div className="px-5 pb-5 border-t border-white/10 pt-4">
                <ol className="space-y-2 text-sm text-white/80">
                  <li className="flex gap-2">
                    <span className="font-bold text-orange-400">1.</span>
                    <span>Click the <strong>lock icon</strong> 🔒 in the address bar</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-orange-400">2.</span>
                    <span>Click <strong>"More Information"</strong> or the <strong>arrow →</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-orange-400">3.</span>
                    <span>Click <strong>"Permissions"</strong> tab</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-orange-400">4.</span>
                    <span>Find <strong>"Use the Camera"</strong> and <strong>"Use the Microphone"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-orange-400">5.</span>
                    <span>Uncheck <strong>"Blocked"</strong> for both</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-orange-400">6.</span>
                    <span>Reload the page (F5 or Ctrl+R / Cmd+R)</span>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Desktop Safari */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <button
              onClick={() => toggleSection('safari-desktop')}
              className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition"
            >
              <div className="flex items-center gap-3">
                <Globe size={20} className="text-cyan-400" />
                <div className="text-left">
                  <h3 className="font-bold text-white">Desktop Safari (Mac)</h3>
                  <p className="text-xs text-white/60">macOS</p>
                </div>
              </div>
              {expandedSection === 'safari-desktop' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSection === 'safari-desktop' && (
              <div className="px-5 pb-5 border-t border-white/10 pt-4">
                <ol className="space-y-2 text-sm text-white/80">
                  <li className="flex gap-2">
                    <span className="font-bold text-cyan-400">1.</span>
                    <span>Click <strong>Safari</strong> in the menu bar → <strong>Settings for This Website</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-cyan-400">2.</span>
                    <span>Find <strong>Camera</strong> and <strong>Microphone</strong> dropdowns</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-cyan-400">3.</span>
                    <span>Change both to <strong>"Allow"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-cyan-400">4.</span>
                    <span>Reload the page (Cmd+R)</span>
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Troubleshooting */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 mt-6">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <AlertCircle size={18} className="text-yellow-400" />
              Still Not Working?
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex gap-2">
                <span className="text-yellow-400">•</span>
                <span>Make sure your camera/mic is not being used by another app</span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400">•</span>
                <span>Try closing and reopening your browser</span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400">•</span>
                <span>Check if your device has physical camera/mic privacy switches</span>
              </li>
              <li className="flex gap-2">
                <span className="text-yellow-400">•</span>
                <span>On some devices, you may need to grant system-level permissions first</span>
              </li>
            </ul>
          </div>

          {/* Permission Icons Reference */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5 mt-6">
            <h3 className="font-bold text-white mb-3">What Permissions Are Used For</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Camera size={20} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white text-sm">Camera</p>
                  <p className="text-xs text-white/70">Take photos and record videos for your reflections</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mic size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white text-sm">Microphone</p>
                  <p className="text-xs text-white/70">Record audio notes and voice reflections</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-white/50 mt-4 italic">
              All media stays on your device. Reflexia works completely offline and never uploads your data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
