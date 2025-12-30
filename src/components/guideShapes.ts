export type GuideShape = 'sphere' | 'cube' | 'pyramid' | 'cylinder' | 'capsule' | 'slab';
export interface ShapeGeometry { top?: string; left?: string; right?: string; isRound?: boolean; }
export const SHAPES: Record<GuideShape, ShapeGeometry> = {
  sphere: { isRound: true },
  cube: { top: "M100 50 L150 75 L100 100 L50 75 Z", left: "M50 75 L100 100 L100 150 L50 125 Z", right: "M100 100 L150 75 L150 125 L100 150 Z" },
  pyramid: { left: "M100 40 L50 130 L100 150 Z", right: "M100 40 L100 150 L150 130 Z" },
  cylinder: { top: "M100 60 C127.6 60 150 69 150 80 C150 91 127.6 100 100 100 C72.4 100 50 91 50 80 C50 69 72.4 60 100 60 Z", left: "M50 80 L50 140 C50 151 72.4 160 100 160 C127.6 160 150 151 150 140 L150 80 C150 91 127.6 100 100 100 C72.4 100 50 91 50 80 Z" },
  capsule: { top: "M100 50 C122 50 140 68 140 90 L140 110 C140 132 122 150 100 150 C78 150 60 132 60 110 L60 90 C60 68 78 50 100 50 Z", left: "M100 60 C116 60 130 70 130 90 L130 110 C130 130 116 140 100 140 C84 140 70 130 70 110 L70 90 C70 70 84 60 100 60 Z" },
  slab: { top: "M100 80 L160 95 L100 110 L40 95 Z", left: "M40 95 L100 110 L100 130 L40 115 Z", right: "M100 110 L160 95 L160 115 L100 130 Z" }
};