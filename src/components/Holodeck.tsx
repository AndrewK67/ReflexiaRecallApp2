import React, { useState } from 'react';
import HolodeckHub from './holodeck/HolodeckHub';
import UniversalSpace from './holodeck/UniversalSpace';
import type { SpaceId, HolodeckEntry } from './holodeck/types';

interface HolodeckProps {
  onClose: () => void;
}

export default function Holodeck({ onClose }: HolodeckProps) {
  const [activeSpace, setActiveSpace] = useState<SpaceId | null>(null);

  const handleSelectSpace = (spaceId: SpaceId) => {
    setActiveSpace(spaceId);
  };

  const handleExitSpace = () => {
    setActiveSpace(null);
  };

  const handleSaveEntry = (entry: HolodeckEntry) => {
    // Save to local storage
    const existingEntries = JSON.parse(localStorage.getItem('holodeckEntries') || '[]');
    const updatedEntries = [entry, ...existingEntries];
    localStorage.setItem('holodeckEntries', JSON.stringify(updatedEntries));

    console.log('Holodeck entry saved:', entry);
  };

  // Show specific space if one is active
  if (activeSpace) {
    return (
      <UniversalSpace
        spaceId={activeSpace}
        onExit={handleExitSpace}
        onSave={handleSaveEntry}
      />
    );
  }

  // Show hub selector
  return (
    <HolodeckHub
      onSelectSpace={handleSelectSpace}
      onClose={onClose}
    />
  );
}
