/**
 * A reflection framework: the questions the composer walks someone through.
 *
 * Ids are persistent. `ReflectionFramework.id` is what `entry.model` stores
 * and `FrameworkStage.id` is what `entry.answers` is keyed by, on users'
 * devices, today. Change display text freely; never change an id without a
 * data migration.
 */

export interface FrameworkStage {
  /** Persistent — matches the answer keys already saved on devices. */
  id: string;
  /** Short heading: "What happened?" */
  label: string;
  /** The question shown above the text box. */
  question: string;
  placeholder?: string;
  /** The offline Coach tip for this stage. */
  coaching: string;
}

export type FrameworkKind = 'built-in' | 'framework' | 'legacy';

export interface ReflectionFramework {
  /** Persistent — matches `entry.model` already saved on devices. */
  id: string;
  /** Display name: "Three-Part", "Open Entry", "Gibbs' Reflective Cycle". */
  name: string;
  /** One line under the name. */
  tagline: string;
  kind: FrameworkKind;
  /** Where it comes from, so the picker is honest: "Gibbs, 1988". */
  origin?: string;
  stages: FrameworkStage[];
}
