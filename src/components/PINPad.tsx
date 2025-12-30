import React, { useState, useEffect } from 'react';
import { Lock, X, Check, Delete, Shield } from 'lucide-react';

interface PINPadProps {
  mode: 'setup' | 'verify' | 'change';
  onSuccess: () => void;
  onCancel: () => void;
  onVerify?: (pin: string) => boolean; // For verify mode
  onSetup?: (pin: string) => void; // For setup mode
  onChange?: (oldPIN: string, newPIN: string) => boolean; // For change mode
}

export default function PINPad({ mode, onSuccess, onCancel, onVerify, onSetup, onChange }: PINPadProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm' | 'old' | 'new'>('enter');
  const [error, setError] = useState('');
  const [oldPIN, setOldPIN] = useState('');

  useEffect(() => {
    if (mode === 'change') {
      setStep('old');
    } else if (mode === 'setup') {
      setStep('enter');
    } else {
      setStep('enter');
    }
  }, [mode]);

  const handleNumberClick = (num: string) => {
    setError('');

    if (step === 'old') {
      if (oldPIN.length < 6) {
        setOldPIN(oldPIN + num);
      }
    } else if (step === 'enter') {
      if (pin.length < 6) {
        setPin(pin + num);
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 6) {
        setConfirmPin(confirmPin + num);
      }
    } else if (step === 'new') {
      if (pin.length < 6) {
        setPin(pin + num);
      }
    }
  };

  const handleDelete = () => {
    setError('');
    if (step === 'old') {
      setOldPIN(oldPIN.slice(0, -1));
    } else if (step === 'enter' || step === 'new') {
      setPin(pin.slice(0, -1));
    } else if (step === 'confirm') {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const handleSubmit = () => {
    if (mode === 'verify') {
      if (pin.length < 4) {
        setError('PIN must be at least 4 digits');
        return;
      }
      if (onVerify && onVerify(pin)) {
        onSuccess();
      } else {
        setError('Incorrect PIN');
        setPin('');
      }
    } else if (mode === 'setup') {
      if (step === 'enter') {
        if (pin.length < 4) {
          setError('PIN must be at least 4 digits');
          return;
        }
        setStep('confirm');
      } else if (step === 'confirm') {
        if (confirmPin !== pin) {
          setError('PINs do not match');
          setConfirmPin('');
          return;
        }
        if (onSetup) {
          onSetup(pin);
          onSuccess();
        }
      }
    } else if (mode === 'change') {
      if (step === 'old') {
        if (oldPIN.length < 4) {
          setError('PIN must be at least 4 digits');
          return;
        }
        setStep('new');
      } else if (step === 'new') {
        if (pin.length < 4) {
          setError('New PIN must be at least 4 digits');
          return;
        }
        setStep('confirm');
      } else if (step === 'confirm') {
        if (confirmPin !== pin) {
          setError('PINs do not match');
          setConfirmPin('');
          return;
        }
        if (onChange && onChange(oldPIN, pin)) {
          onSuccess();
        } else {
          setError('Old PIN is incorrect');
          setStep('old');
          setOldPIN('');
          setPin('');
          setConfirmPin('');
        }
      }
    }
  };

  const getCurrentPin = () => {
    if (step === 'old') return oldPIN;
    if (step === 'confirm') return confirmPin;
    return pin;
  };

  const getTitle = () => {
    if (mode === 'verify') return 'Enter PIN';
    if (mode === 'change') {
      if (step === 'old') return 'Enter Current PIN';
      if (step === 'new') return 'Enter New PIN';
      if (step === 'confirm') return 'Confirm New PIN';
    }
    if (mode === 'setup') {
      if (step === 'enter') return 'Create PIN';
      if (step === 'confirm') return 'Confirm PIN';
    }
    return 'Enter PIN';
  };

  const getDescription = () => {
    if (mode === 'verify') return 'Enter your PIN to unlock';
    if (mode === 'change') {
      if (step === 'old') return 'Verify your identity';
      if (step === 'new') return 'Choose a new 4-6 digit PIN';
      if (step === 'confirm') return 'Re-enter your new PIN';
    }
    if (mode === 'setup') {
      if (step === 'enter') return 'Choose a 4-6 digit PIN to secure your entries';
      if (step === 'confirm') return 'Re-enter your PIN to confirm';
    }
    return '';
  };

  const currentPin = getCurrentPin();

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-3xl border border-white/15 w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Shield size={24} className="text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
                <p className="text-xs text-white/60 mt-0.5">{getDescription()}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white/60 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* PIN Display */}
          <div className="flex justify-center gap-3 mt-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition ${
                  i < currentPin.length
                    ? 'border-cyan-500 bg-cyan-500/20'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                {i < currentPin.length && (
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                )}
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-red-300 text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Number Pad */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="h-16 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-2xl font-bold transition active:scale-95"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleDelete}
              className="h-16 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition active:scale-95 flex items-center justify-center"
            >
              <Delete size={24} />
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="h-16 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-2xl font-bold transition active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              disabled={currentPin.length < 4}
              className="h-16 rounded-2xl bg-cyan-500 hover:bg-cyan-600 disabled:bg-white/10 disabled:text-white/40 text-white transition active:scale-95 flex items-center justify-center disabled:cursor-not-allowed"
            >
              <Check size={24} />
            </button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="px-6 pb-6">
          <p className="text-center text-xs text-white/40">
            {mode === 'verify' && 'Your entries are protected'}
            {mode === 'setup' && 'Use a PIN you can remember but others cannot guess'}
            {mode === 'change' && 'Choose a secure PIN'}
          </p>
        </div>
      </div>
    </div>
  );
}
