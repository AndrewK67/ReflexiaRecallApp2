import React, { useState } from 'react';
import HolodeckSpace from '../HolodeckSpace';
import { getSpaceById } from '../../../data/holodeckSpaces';
import type { HolodeckEntry } from '../types';

interface DifficultConversationProps {
  onExit: () => void;
  onSave?: (entry: HolodeckEntry) => void;
}

export default function DifficultConversation({ onExit, onSave }: DifficultConversationProps) {
  const space = getSpaceById('difficult-conversation')!;
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
      progress={progress}
      color={space.color}
      showNext={true}
      showPrevious={currentPromptIndex > 0}
      nextLabel={isLastPrompt ? 'Finish' : 'Next'}
    />
  );
}
