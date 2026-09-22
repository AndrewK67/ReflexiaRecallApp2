import React, { useState } from 'react';
import HolodeckHub from './holodeck/HolodeckHub';
import ReflectionFlow from './ReflectionFlow';
import { spaceFramework, type ReflectionFramework } from '../frameworks';
import type { ReflectionEntry } from '../types';
import type { SpaceId } from './holodeck/types';

interface HolodeckProps {
  onClose: () => void;
  /** A finished space is an ordinary entry (phase 3A.4): encrypted, in Archive, in the backup. */
  onComplete: (entry: ReflectionEntry) => void;
}

export default function Holodeck({ onClose, onComplete }: HolodeckProps) {
  const [active, setActive] = useState<ReflectionFramework | null>(null);

  const handleSelectSpace = (spaceId: SpaceId) => {
    const framework = spaceFramework(spaceId);
    if (framework) setActive(framework);
  };

  if (active) {
    return (
      <ReflectionFlow
        key={active.id}
        initialFramework={active}
        onComplete={onComplete}
        onCancel={() => setActive(null)}
      />
    );
  }

  return <HolodeckHub onSelectSpace={handleSelectSpace} onClose={onClose} />;
}
