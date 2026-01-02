/**
 * Disclaimer Quiz Service
 *
 * Gamified quiz that ensures users actually read critical disclaimers.
 * Users must answer questions correctly to earn high-value XP rewards.
 */

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct answer
  explanation: string;
  xpReward: number;
  referenceSection: string; // Which part of disclaimer this comes from
}

export interface QuizProgress {
  questionsAnswered: string[];
  correctAnswers: number;
  totalXpEarned: number;
  completedAt?: string;
  passed: boolean;
}

const STORAGE_KEY = 'reflexia_disclaimer_quiz_progress';
const PASSING_SCORE = 0.8; // Must get 80% correct to pass

/**
 * Quiz questions that require reading specific disclaimer sections
 * High XP rewards (300-500 per question) to incentivize completion
 */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'Q1_AI_ASSIST',
    question: 'What is the primary purpose of AI features in Reflexia?',
    options: [
      'To replace your professional judgment',
      'To assist you - NOT replace your professional judgment',
      'To make decisions for you',
      'To guarantee accuracy of all outputs',
    ],
    correctAnswer: 1,
    explanation: 'Reflexia is designed to ASSIST you, not replace your professional judgment. You remain fully responsible for all decisions.',
    xpReward: 400,
    referenceSection: 'AI-Generated Content Warning',
  },
  {
    id: 'Q2_AI_ACCURACY',
    question: 'Can AI-generated content from Reflexia be relied upon for complete accuracy?',
    options: [
      'Yes, AI is always accurate',
      'Yes, but only for professional documentation',
      'No, AI may contain errors and must be verified',
      'Only if you have a premium subscription',
    ],
    correctAnswer: 2,
    explanation: 'AI cannot be relied upon for complete accuracy. It may hallucinate, make errors, or provide inappropriate suggestions. YOU must verify everything.',
    xpReward: 500,
    referenceSection: 'AI-Generated Content Warning',
  },
  {
    id: 'Q3_REGULATORY_ENDORSEMENT',
    question: 'Is Reflexia affiliated with or endorsed by professional regulatory bodies (NMC, GMC, HCPC, etc.)?',
    options: [
      'Yes, it is officially endorsed',
      'Yes, but only in the UK',
      'No, it is not affiliated with any regulatory body',
      'Only for certain professions',
    ],
    correctAnswer: 2,
    explanation: 'Reflexia is NOT affiliated with, endorsed by, or approved by ANY professional regulatory body. It is an independent tool.',
    xpReward: 450,
    referenceSection: 'Not Affiliated with Regulatory Bodies',
  },
  {
    id: 'Q4_USER_RESPONSIBILITY',
    question: 'Who is responsible for verifying the accuracy of AI-generated documentation before submission?',
    options: [
      'Reflexia developers',
      'The AI system',
      'Your regulatory body',
      'YOU - the end user',
    ],
    correctAnswer: 3,
    explanation: 'YOU are entirely responsible for verifying accuracy, checking suitability, and reviewing ALL outputs before professional use.',
    xpReward: 500,
    referenceSection: 'Your Responsibilities',
  },
  {
    id: 'Q5_AI_HALLUCINATION',
    question: 'What is one thing AI can do that makes it unreliable?',
    options: [
      'Always tell the truth',
      'Hallucinate - make up false information',
      'Never make mistakes',
      'Understand your exact situation',
    ],
    correctAnswer: 1,
    explanation: 'AI can hallucinate (fabricate information), make errors, misunderstand context, and give inappropriate suggestions.',
    xpReward: 400,
    referenceSection: 'AI Cannot Be Trusted for Accuracy',
  },
  {
    id: 'Q6_PROFESSIONAL_ADVICE',
    question: 'Should you use AI-generated content from Reflexia for medical, legal, or financial decisions?',
    options: [
      'Yes, it is designed for professional advice',
      'Yes, but only for minor decisions',
      'No, AI responses are NOT professional advice',
      'Only with supervisor approval',
    ],
    correctAnswer: 2,
    explanation: 'AI responses are NOT professional advice (medical, legal, financial, therapeutic, or otherwise). Never rely on AI for professional decisions.',
    xpReward: 500,
    referenceSection: 'AI-Generated Content Warning',
  },
  {
    id: 'Q7_CPD_RECORDS',
    question: 'Is Reflexia a substitute for official CPD records required by your regulator?',
    options: [
      'Yes, you can use it instead of official records',
      'Yes, but only for certain professions',
      'No, it is a personal tool only - not official CPD records',
      'Only if exported in the correct format',
    ],
    correctAnswer: 2,
    explanation: 'Reflexia is a personal productivity tool ONLY. It is NOT a substitute for official CPD records. You must maintain records as required by YOUR regulator.',
    xpReward: 450,
    referenceSection: 'Not Official CPD Records',
  },
  {
    id: 'Q8_SUBMISSION_WARNING',
    question: 'What must you do before submitting AI-generated documentation to your regulatory body?',
    options: [
      'Nothing - submit it directly',
      'Just check for spelling errors',
      'Thoroughly review, edit, and verify ALL content for accuracy and suitability',
      'Add your name to the document',
    ],
    correctAnswer: 2,
    explanation: 'You MUST thoroughly review, edit, and verify ALL AI-generated content before using it professionally. Never submit without verification.',
    xpReward: 500,
    referenceSection: 'Your Complete Responsibility',
  },
  {
    id: 'Q9_APP_PURPOSE',
    question: 'What is Reflexia designed to do?',
    options: [
      'Replace professional judgment and decision-making',
      'Guarantee regulatory compliance',
      'Assist you with reflection and professional development',
      'Provide official endorsement for your CPD',
    ],
    correctAnswer: 2,
    explanation: 'Reflexia is designed to ASSIST you with reflection, CPD tracking, and professional development - NOT to replace your judgment or guarantee compliance.',
    xpReward: 400,
    referenceSection: 'What Reflexia IS',
  },
  {
    id: 'Q10_LIABILITY',
    question: 'If you submit AI-generated content that contains errors, who is liable?',
    options: [
      'Reflexia developers',
      'The AI system',
      'Your regulatory body',
      'YOU - the end user',
    ],
    correctAnswer: 3,
    explanation: 'YOU are liable for anything you submit. Reflexia is provided "AS IS" with no warranties. We are not liable for rejected submissions or professional consequences.',
    xpReward: 500,
    referenceSection: 'Limitation of Liability',
  },
];

/**
 * Calculate total possible XP
 */
export function getTotalPossibleXP(): number {
  return QUIZ_QUESTIONS.reduce((sum, q) => sum + q.xpReward, 0);
}

/**
 * Initialize quiz progress
 */
export function initializeQuizProgress(): QuizProgress {
  const progress: QuizProgress = {
    questionsAnswered: [],
    correctAnswers: 0,
    totalXpEarned: 0,
    passed: false,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

/**
 * Get current quiz progress
 */
export function getQuizProgress(): QuizProgress | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Answer a quiz question
 */
export function answerQuestion(
  questionId: string,
  selectedAnswer: number
): {
  correct: boolean;
  xpEarned: number;
  explanation: string;
  progress: QuizProgress;
  quizComplete: boolean;
  passed: boolean;
} {
  let progress = getQuizProgress() || initializeQuizProgress();

  const question = QUIZ_QUESTIONS.find(q => q.id === questionId);
  if (!question) {
    throw new Error('Question not found');
  }

  // Check if already answered
  if (progress.questionsAnswered.includes(questionId)) {
    return {
      correct: false,
      xpEarned: 0,
      explanation: 'You have already answered this question.',
      progress,
      quizComplete: progress.questionsAnswered.length === QUIZ_QUESTIONS.length,
      passed: progress.passed,
    };
  }

  const correct = selectedAnswer === question.correctAnswer;

  // Update progress
  progress.questionsAnswered.push(questionId);

  if (correct) {
    progress.correctAnswers += 1;
    progress.totalXpEarned += question.xpReward;
  }

  // Check if quiz is complete
  const quizComplete = progress.questionsAnswered.length === QUIZ_QUESTIONS.length;

  if (quizComplete) {
    const score = progress.correctAnswers / QUIZ_QUESTIONS.length;
    progress.passed = score >= PASSING_SCORE;
    progress.completedAt = new Date().toISOString();
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

  return {
    correct,
    xpEarned: correct ? question.xpReward : 0,
    explanation: question.explanation,
    progress,
    quizComplete,
    passed: progress.passed,
  };
}

/**
 * Get next unanswered question
 */
export function getNextQuestion(): QuizQuestion | null {
  const progress = getQuizProgress();
  if (!progress) return QUIZ_QUESTIONS[0];

  return QUIZ_QUESTIONS.find(q => !progress.questionsAnswered.includes(q.id)) || null;
}

/**
 * Check if user has completed and passed the quiz
 */
export function hasPassedQuiz(): boolean {
  const progress = getQuizProgress();
  return progress?.passed || false;
}

/**
 * Reset quiz (for retaking)
 */
export function resetQuiz(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get quiz statistics
 */
export function getQuizStats(): {
  totalQuestions: number;
  totalPossibleXP: number;
  passingScore: number;
  questionsAnswered: number;
  correctAnswers: number;
  score: number;
  xpEarned: number;
} {
  const progress = getQuizProgress();
  const totalQuestions = QUIZ_QUESTIONS.length;
  const totalPossibleXP = getTotalPossibleXP();

  return {
    totalQuestions,
    totalPossibleXP,
    passingScore: PASSING_SCORE,
    questionsAnswered: progress?.questionsAnswered.length || 0,
    correctAnswers: progress?.correctAnswers || 0,
    score: progress ? progress.correctAnswers / totalQuestions : 0,
    xpEarned: progress?.totalXpEarned || 0,
  };
}
