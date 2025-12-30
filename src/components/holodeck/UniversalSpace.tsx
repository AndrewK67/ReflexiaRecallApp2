import React, { useState } from 'react';
import HolodeckSpace from './HolodeckSpace';
import { getSpaceById } from '../../data/holodeckSpaces';
import type { SpaceId, HolodeckEntry } from './types';

interface UniversalSpaceProps {
  spaceId: SpaceId;
  onExit: () => void;
  onSave?: (entry: HolodeckEntry) => void;
}

/**
 * Universal Space Component
 * Handles all 20 Holodeck spaces with a single reusable component
 */
export default function UniversalSpace({ spaceId, onExit, onSave }: UniversalSpaceProps) {
  const space = getSpaceById(spaceId);

  if (!space) {
    return (
      <div className="h-full bg-slate-900 text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 font-bold mb-2">Space not found</p>
          <button
            onClick={onExit}
            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(space.prompts.length).fill(''));

  const currentPrompt = space.prompts[currentPromptIndex];
  const progress = (currentPromptIndex + 1) / space.prompts.length;
  const isLastPrompt = currentPromptIndex === space.prompts.length - 1;

  const handleAnswer = (text: string) => {
    const newAnswers = [...answers];
    newAnswers[currentPromptIndex] = text;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (isLastPrompt) {
      // Save and exit
      if (onSave) {
        const entry: HolodeckEntry = {
          id: `holodeck_${Date.now()}`,
          spaceId: space.id,
          spaceName: space.name,
          date: new Date().toISOString(),
          answers,
          prompts: space.prompts,
          completed: true,
          createdAt: Date.now(),
        };
        onSave(entry);
      }
      onExit();
    } else {
      setCurrentPromptIndex((prev) => Math.min(prev + 1, space.prompts.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentPromptIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSaveProgress = () => {
    if (onSave) {
      const entry: HolodeckEntry = {
        id: `holodeck_${Date.now()}`,
        spaceId: space.id,
        spaceName: space.name,
        date: new Date().toISOString(),
        answers,
        prompts: space.prompts,
        completed: false, // Partial save
        createdAt: Date.now(),
      };
      onSave(entry);
    }
    onExit();
  };

  return (
    <HolodeckSpace
      title={space.name}
      purpose={space.purpose}
      currentPrompt={currentPrompt}
      answer={answers[currentPromptIndex]}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onPrevious={currentPromptIndex > 0 ? handlePrevious : undefined}
      onExit={onExit}
      onSave={handleSaveProgress}
      progress={progress}
      color={space.color}
      showNext={true}
      showPrevious={currentPromptIndex > 0}
      showSave={true}
      nextLabel={isLastPrompt ? 'Finish' : 'Next'}
      isSafetyCritical={space.isSafetyCritical}
    />
  );
}
