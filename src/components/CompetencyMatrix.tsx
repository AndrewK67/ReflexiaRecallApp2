
import React, { useMemo } from 'react';
import type { Entry, ProfessionType, ReflectionEntry } from '../types';
import { PROFESSION_CONFIG } from '../constants';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Award } from 'lucide-react';

interface CompetencyMatrixProps {
  entries: Entry[];
  profession: ProfessionType;
}

const CompetencyMatrix: React.FC<CompetencyMatrixProps> = ({ entries, profession }) => {
  const data = useMemo(() => {
    if (profession === 'NONE') return [];

    const profStandards = PROFESSION_CONFIG[profession]?.standards;
    if (!profStandards) return [];

    const categoryCounts: Record<string, number> = {};
    
    // Initialize all categories with 0
    profStandards.forEach(s => {
      if (s.category) {
        if (!categoryCounts[s.category]) categoryCounts[s.category] = 0;
      }
    });

    // Count matched standards from history (only from reflection entries)
    entries.forEach(entry => {
      // Type guard: cpd only exists on ReflectionEntry
      if (entry.type === 'reflection' || entry.type === 'REFLECTION') {
        const reflectionEntry = entry as ReflectionEntry;
        if (reflectionEntry.cpd && reflectionEntry.cpd.standardsMatched) {
          reflectionEntry.cpd.standardsMatched.forEach(stdId => {
            const standard = profStandards.find(s => s.id === stdId);
            if (standard && standard.category) {
              categoryCounts[standard.category] += 1;
            }
          });
        }
      }
    });

    // Transform for Recharts
    // If no data, return basic structure to show empty chart
    const result = Object.entries(categoryCounts).map(([subject, A]) => ({
      subject,
      A,
      fullMark: Math.max(...Object.values(categoryCounts), 5) // Scale chart dynamic
    }));

    return result.length > 0 ? result : [
        { subject: 'Ethics', A: 0, fullMark: 5 },
        { subject: 'Safety', A: 0, fullMark: 5 },
        { subject: 'Communication', A: 0, fullMark: 5 },
        { subject: 'Clinical', A: 0, fullMark: 5 },
        { subject: 'Leadership', A: 0, fullMark: 5 },
    ];

  }, [entries, profession]);

  if (profession === 'NONE') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
        <Award size={32} className="mb-3 opacity-50" />
        <p className="text-sm">Select a profession to view competency.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72 bg-slate-900 rounded-xl border border-slate-800 relative">
       <div className="absolute top-4 left-4 z-10">
         <h3 className="text-white font-bold flex items-center gap-2">
            <Award className="text-yellow-400" size={16} /> Competency Matrix
         </h3>
         <p className="text-[10px] text-slate-400">Skills distribution based on CPD logs</p>
       </div>

       <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="55%" outerRadius="65%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} />
          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
          <Radar
            name="Competency"
            dataKey="A"
            stroke="#06b6d4"
            strokeWidth={2}
            fill="#06b6d4"
            fillOpacity={0.4}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#67e8f9' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompetencyMatrix;
