import React, { useState } from 'react';
import { Eye, Hand, Ear, Coffee, Smile, ArrowLeft, CheckCircle } from 'lucide-react';

interface GroundingProps {
  onClose: () => void;
}

const Grounding: React.FC<GroundingProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      count: 5,
      label: 'Things you can SEE',
      icon: Eye,
      color: 'text-blue-400',
      desc: 'Look around you. Notice 5 distinct objects. Say them out loud or in your head.',
    },
    {
      count: 4,
      label: 'Things you can TOUCH',
      icon: Hand,
      color: 'text-green-400',
      desc: 'Feel the texture of your clothes, the table, or your own skin.',
    },
    {
      count: 3,
      label: 'Things you can HEAR',
      icon: Ear,
      color: 'text-purple-400',
      desc: 'Listen closely. Traffic? Birds? Computer hum?',
    },
    {
      count: 2,
      label: 'Things you can SMELL',
      icon: Coffee,
      color: 'text-orange-400',
      desc: "If you can't smell anything, recall a favorite scent like coffee or rain.",
    },
    {
      count: 1,
      label: 'Thing you can TASTE',
      icon: Smile,
      color: 'text-pink-400',
      desc: 'Take a sip of water, or notice the current taste in your mouth.',
    },
  ];

  const handleNext = () => {
    if (step < steps.length) setStep(step + 1);
    else onClose();
  };

  const isComplete = step >= steps.length;

  return (
    <div className="h-full bg-slate-900 text-white flex flex-col relative overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
      {/* Background Decor */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 10%, transparent 50%)' }}
      />

      {/* Header */}
      <div className="p-6 flex items-center justify-between z-10">
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold uppercase tracking-widest text-slate-400">Grounding Center</h1>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 text-center">
        {isComplete ? (
          <div className="animate-in zoom-in duration-500 flex flex-col items-center">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
              <CheckCircle size={64} />
            </div>
            <h2 className="text-3xl font-bold mb-4">You are here.</h2>
            <p className="text-slate-400 mb-8 max-w-xs">
              You have completed the 5-4-3-2-1 grounding exercise. Carry this presence with you.
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-white text-slate-900 font-bold rounded-full hover:scale-105 transition-transform"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div className="text-[10rem] font-black text-slate-800 leading-none select-none absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
              {steps[step].count}
            </div>

            <div className="relative z-10 animate-in slide-in-from-right duration-300" key={step}>
              <div
                className={`w-20 h-20 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-slate-700 ${steps[step].color}`}
              >
                {React.createElement(steps[step].icon, { size: 40 })}
              </div>

              <h2 className="text-2xl font-bold mb-2">
                Find <span className={steps[step].color}>{steps[step].count}</span> {steps[step].label}
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-12 min-h-[80px]">{steps[step].desc}</p>

              <button
                onClick={handleNext}
                className="w-full py-4 bg-white/10 border border-white/15 rounded-2xl font-bold text-lg hover:bg-white/15 transition-all active:scale-95"
              >
                I've found them
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Progress Dots */}
      <div className="p-8 flex justify-center gap-3 z-10">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-500 ${
              i <= step ? (i === step && !isComplete ? 'bg-white scale-125' : 'bg-slate-600') : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Grounding;
