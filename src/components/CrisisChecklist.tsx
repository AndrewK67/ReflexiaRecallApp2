
import React, { useState } from 'react';
import type { IncidentProtocol } from '../types';
import { AlertTriangle, CheckSquare, Square, X } from 'lucide-react';

interface CrisisChecklistProps {
  onClose: () => void;
  onLogAction: (action: string) => void;
}

const PROTOCOLS: IncidentProtocol[] = [
  {
    id: 'SEPSIS',
    title: 'Sepsis Six (First Hour)',
    steps: [
      'Give Oxygen to maintain sats > 94%',
      'Take Blood Cultures',
      'Give IV Antibiotics',
      'Give IV Fluid Challenge',
      'Measure Lactate',
      'Measure Urine Output'
    ]
  },
  {
    id: 'FALL',
    title: 'Inpatient Fall',
    steps: [
      'Check for Danger (Scene Safety)',
      'Assess ABCDE',
      'Check for Head Injury / #NOF',
      'Neuro Obs (GCS) baseline',
      'Safe manual handling lift',
      'Inform Medical Team / Family',
      'Datix / Incident Report'
    ]
  },
  {
    id: 'DE_ESCALATION',
    title: 'Aggression De-escalation',
    steps: [
      'Maintain Safe Distance (2 arm lengths)',
      'Open Posture (Hands visible)',
      'Identify triggers',
      'Speak slowly and clearly',
      'Offer choices/options',
      'Call for assistance if needed'
    ]
  }
];

const CrisisChecklist: React.FC<CrisisChecklistProps> = ({ onClose, onLogAction }) => {
  const [activeProtocol, setActiveProtocol] = useState<IncidentProtocol | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (step: string) => {
    const newSet = new Set(checkedSteps);
    if (newSet.has(step)) {
      newSet.delete(step);
    } else {
      newSet.add(step);
      onLogAction(`Completed Protocol Step: ${step}`);
    }
    setCheckedSteps(newSet);
  };

  if (!activeProtocol) {
    return (
      <div className="absolute inset-0 bg-slate-900/95 z-50 p-6 flex flex-col animate-in fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
             <AlertTriangle /> Crisis Protocols
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full"><X className="text-white" /></button>
        </div>
        
        <div className="grid gap-3">
           {PROTOCOLS.map(p => (
             <button 
               key={p.id}
               onClick={() => setActiveProtocol(p)}
               className="bg-slate-800 p-4 rounded-xl text-left border border-slate-700 hover:bg-slate-700 transition-colors"
             >
               <h3 className="font-bold text-white text-lg">{p.title}</h3>
               <p className="text-slate-400 text-sm">{p.steps.length} Actions</p>
             </button>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-red-950/95 z-50 p-6 flex flex-col animate-in slide-in-from-bottom">
       <div className="flex justify-between items-center mb-6">
          <button onClick={() => setActiveProtocol(null)} className="text-red-200 font-bold text-sm uppercase">Back</button>
          <h2 className="text-xl font-bold text-white">{activeProtocol.title}</h2>
          <div className="w-8"></div>
       </div>

       <div className="space-y-4 overflow-y-auto flex-1">
          {activeProtocol.steps.map((step, i) => (
             <button
               key={i}
               onClick={() => toggleStep(step)}
               className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all ${
                 checkedSteps.has(step) 
                 ? 'bg-green-900/30 border-green-500 text-green-100' 
                 : 'bg-slate-900 border-slate-700 text-white'
               }`}
             >
                {checkedSteps.has(step) ? (
                   <CheckSquare className="text-green-500 flex-shrink-0" size={24} />
                ) : (
                   <Square className="text-slate-500 flex-shrink-0" size={24} />
                )}
                <span className={`text-left font-medium ${checkedSteps.has(step) ? 'line-through opacity-70' : ''}`}>
                   {step}
                </span>
             </button>
          ))}
       </div>
    </div>
  );
};

export default CrisisChecklist;
