
import React from 'react';
import { StageId } from '../types';

interface StageIconProps {
  stageId: StageId;
  size?: number;
  className?: string;
  grayscale?: boolean;
}

const StageIcon: React.FC<StageIconProps> = ({ stageId, size = 40, className = '', grayscale = false }) => {
  
  const getColors = () => {
    switch (stageId) {
      // GIBBS
      case StageId.Description: return '#4ade80'; 
      case StageId.Feelings: return '#f87171'; 
      case StageId.Evaluation: return '#60a5fa'; 
      case StageId.Analysis: return '#c084fc'; 
      case StageId.Conclusion: return '#fb923c'; 
      case StageId.ActionPlan: return '#facc15'; 
      
      // SBAR
      case StageId.SBAR_Situation: return '#f87171'; 
      case StageId.SBAR_Background: return '#60a5fa'; 
      case StageId.SBAR_Assessment: return '#c084fc'; 
      case StageId.SBAR_Recommendation: return '#4ade80'; 

      // ERA
      case StageId.ERA_Experience: return '#67e8f9'; 
      case StageId.ERA_Reflection: return '#818cf8'; 
      case StageId.ERA_Action: return '#fb923c'; 

      // ROLFE
      case StageId.ROLFE_What: return '#67e8f9';
      case StageId.ROLFE_SoWhat: return '#c084fc';
      case StageId.ROLFE_NowWhat: return '#facc15';

      // STAR
      case StageId.STAR_Situation: return '#f87171';
      case StageId.STAR_Task: return '#60a5fa';
      case StageId.STAR_Action: return '#4ade80';
      case StageId.STAR_Result: return '#fb923c';

      // SOAP
      case StageId.SOAP_Subjective: return '#c084fc';
      case StageId.SOAP_Objective: return '#60a5fa';
      case StageId.SOAP_Assessment: return '#facc15';
      case StageId.SOAP_Plan: return '#4ade80';

      // MORNING
      case StageId.MORNING_Energy: return '#06b6d4'; 
      case StageId.MORNING_Gratitude: return '#facc15'; 
      case StageId.MORNING_Intention: return '#4ade80'; 

      // EVENING
      case StageId.EVENING_Wins: return '#fb923c'; 
      case StageId.EVENING_Growth: return '#9333ea'; 
      case StageId.EVENING_Unwind: return '#3b82f6'; 

      // FREE
      case StageId.FREE_Writing: return '#94a3b8';

      default: return '#94a3b8';
    }
  };

  const hex = grayscale ? '#94a3b8' : getColors();
  const uid = `icon-${stageId}-${Math.random().toString(36).substr(2, 5)}`;
  const baseOpacity = grayscale ? 0.6 : 1;

  // Face Styles
  const faceStyle = (opacity: number): React.CSSProperties => ({
    fill: hex,
    stroke: grayscale ? '#cbd5e1' : "white",
    strokeWidth: 1.5,
    opacity: opacity * baseOpacity,
    vectorEffect: "non-scaling-stroke" as any,
  });

  const renderShape = () => {
    const faces: React.ReactNode[] = [];

    switch (stageId) {
      // CUBE
      case StageId.Evaluation:
      case StageId.SBAR_Background:
      case StageId.STAR_Task:
      case StageId.SOAP_Objective:
         faces.push(<path key="top" d="M100 40 L150 65 L100 90 L50 65 Z" style={faceStyle(0.8)} />);
         faces.push(<path key="left" d="M50 65 L100 90 L100 150 L50 125 Z" style={faceStyle(0.6)} />);
         faces.push(<path key="right" d="M100 90 L150 65 L150 125 L100 150 Z" style={faceStyle(0.4)} />);
         break;

      // PYRAMID
      case StageId.Description: 
      case StageId.SBAR_Recommendation:
      case StageId.ROLFE_NowWhat:
      case StageId.STAR_Action:
      case StageId.SOAP_Plan:
      case StageId.MORNING_Gratitude:
         faces.push(<path key="left" d="M100 30 L50 130 L100 150 Z" style={faceStyle(0.7)} />);
         faces.push(<path key="right" d="M100 30 L100 150 L150 130 Z" style={faceStyle(0.5)} />);
         break;

      // CYLINDER
      case StageId.Analysis:
      case StageId.SBAR_Assessment:
      case StageId.ERA_Reflection:
      case StageId.ROLFE_SoWhat:
      case StageId.SOAP_Assessment:
      case StageId.EVENING_Growth:
         faces.push(<ellipse key="top" cx="100" cy="50" rx="50" ry="20" style={faceStyle(0.8)} />);
         faces.push(<path key="body" d="M50 50 L150 50 L150 130 A50 20 0 0 1 50 130 Z" style={faceStyle(0.5)} />);
         break;

      // CAPSULE
      case StageId.Conclusion:
      case StageId.ERA_Action:
      case StageId.STAR_Result:
      case StageId.MORNING_Intention:
         faces.push(<circle key="top" cx="100" cy="60" r="40" style={faceStyle(0.7)} />);
         faces.push(<circle key="bottom" cx="100" cy="140" r="40" style={faceStyle(0.5)} />);
         faces.push(<rect key="mid" x="60" y="60" width="80" height="80" style={faceStyle(0.6)} />);
         break;

      // RECTANGLE
      case StageId.ActionPlan:
      case StageId.FREE_Writing:
         faces.push(<path key="top" d="M60 60 L140 60 L160 40 L80 40 Z" style={faceStyle(0.8)} />);
         faces.push(<path key="front" d="M60 60 L140 60 L140 140 L60 140 Z" style={faceStyle(0.6)} />);
         faces.push(<path key="right" d="M140 60 L160 40 L160 120 L140 140 Z" style={faceStyle(0.4)} />);
         break;

      // SPHERE (Default)
      default:
         faces.push(<circle key="main" cx="100" cy="100" r="60" style={faceStyle(0.6)} />);
         faces.push(<ellipse key="ring" cx="100" cy="100" rx="70" ry="20" fill="none" stroke={hex} strokeWidth="2" opacity="0.6" transform="rotate(20 100 100)" />);
         break;
    }
    return faces;
  };

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} style={{ overflow: 'visible' }}>
      <g>
        {renderShape()}
      </g>
    </svg>
  );
};

export default StageIcon;
