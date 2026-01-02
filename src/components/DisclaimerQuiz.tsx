import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Star,
  Zap,
  Check,
  X,
  Award,
  Target,
  Sparkles,
  Brain,
  AlertCircle,
  BookOpen,
  Gift,
} from 'lucide-react';
import {
  getNextQuestion,
  answerQuestion,
  getQuizProgress,
  getQuizStats,
  initializeQuizProgress,
  getTotalPossibleXP,
  type QuizQuestion,
} from '../services/disclaimerQuizService';

interface DisclaimerQuizProps {
  onComplete: (xpEarned: number) => void;
  onAwardXP?: (amount: number, reason: string) => void;
}

export default function DisclaimerQuiz({ onComplete, onAwardXP }: DisclaimerQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; xpEarned: number; explanation: string } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [stats, setStats] = useState(getQuizStats());

  useEffect(() => {
    // Initialize progress if needed
    if (!getQuizProgress()) {
      initializeQuizProgress();
    }

    // Load first/next question
    const nextQ = getNextQuestion();
    setCurrentQuestion(nextQ);
    setStats(getQuizStats());
  }, []);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !currentQuestion) return;

    const result = answerQuestion(currentQuestion.id, selectedAnswer);
    setLastResult({
      correct: result.correct,
      xpEarned: result.xpEarned,
      explanation: result.explanation,
    });
    setShowResult(true);
    setStats(getQuizStats());

    // Award XP to gamification system
    if (result.correct && result.xpEarned > 0 && onAwardXP) {
      onAwardXP(result.xpEarned, `Disclaimer Quiz: ${currentQuestion.question.substring(0, 50)}...`);
    }

    // Show celebration for correct answers
    if (result.correct) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }

    // Check if quiz is complete
    if (result.quizComplete) {
      setTimeout(() => {
        onComplete(result.progress.totalXpEarned);
      }, 3000);
    }
  };

  const handleNext = () => {
    setShowResult(false);
    setSelectedAnswer(null);
    setLastResult(null);

    const nextQ = getNextQuestion();
    setCurrentQuestion(nextQ);
  };

  if (!currentQuestion) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border-2 border-emerald-500/30 max-w-2xl w-full p-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
              <Trophy size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Quiz Complete!</h2>
            <p className="text-white/70 mb-6">
              Loading your results...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = (stats.questionsAnswered / stats.totalQuestions) * 100;
  const isLastQuestion = stats.questionsAnswered === stats.totalQuestions - 1;

  return (
    <>
      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
          <div className="animate-bounce">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-12 shadow-2xl">
              <Star size={80} className="text-white animate-spin" />
            </div>
          </div>
          <div className="absolute top-1/3 text-center">
            <div className="text-7xl font-bold text-yellow-400 animate-pulse">
              +{lastResult?.xpEarned} XP
            </div>
            <div className="text-2xl font-bold text-white mt-4">
              Correct! 🎉
            </div>
          </div>
        </div>
      )}

      {/* Main Quiz Modal */}
      <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border-2 border-cyan-500/30 max-w-3xl w-full p-8 my-8 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Header */}
          <div className="relative mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                  <Brain size={28} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Disclaimer Knowledge Check</h2>
                  <p className="text-xs text-cyan-400 font-semibold">
                    Question {stats.questionsAnswered + 1} of {stats.totalQuestions}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/60 mb-1">Total XP Earned</div>
                <div className="text-2xl font-bold text-yellow-400">{stats.xpEarned}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/60">Quiz Progress</span>
                <span className="text-sm font-bold text-cyan-400">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Reward Badge */}
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift size={20} className="text-yellow-400" />
                <span className="text-sm text-white/80">Potential reward for this question:</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={20} className="text-yellow-400" />
                <span className="text-lg font-bold text-yellow-400">+{currentQuestion.xpReward} XP</span>
              </div>
            </div>
          </div>

          {/* Question Section */}
          <div className="relative">
            {/* Question Reference */}
            <div className="mb-4 flex items-center gap-2 text-xs text-purple-400">
              <BookOpen size={14} />
              <span>From: {currentQuestion.referenceSection}</span>
            </div>

            {/* Question */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <Target size={16} className="text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white flex-1">{currentQuestion.question}</h3>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      showResult
                        ? index === currentQuestion.correctAnswer
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-white'
                          : selectedAnswer === index
                          ? 'bg-red-500/20 border-red-500/50 text-white/80'
                          : 'bg-white/5 border-white/10 text-white/40'
                        : selectedAnswer === index
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-white scale-[1.02]'
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        showResult
                          ? index === currentQuestion.correctAnswer
                            ? 'border-emerald-400 bg-emerald-500'
                            : selectedAnswer === index
                            ? 'border-red-400 bg-red-500'
                            : 'border-white/20'
                          : selectedAnswer === index
                          ? 'border-cyan-400 bg-cyan-500'
                          : 'border-white/20'
                      }`}>
                        {showResult && index === currentQuestion.correctAnswer && (
                          <Check size={16} className="text-white" />
                        )}
                        {showResult && selectedAnswer === index && index !== currentQuestion.correctAnswer && (
                          <X size={16} className="text-white" />
                        )}
                      </div>
                      <span className="font-semibold">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Result Explanation */}
            {showResult && lastResult && (
              <div className={`mb-6 rounded-2xl border-2 p-5 ${
                lastResult.correct
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-start gap-3">
                  {lastResult.correct ? (
                    <Check size={24} className="text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className={`text-lg font-bold mb-2 ${
                      lastResult.correct ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {lastResult.correct ? '✅ Correct!' : '❌ Incorrect'}
                      {lastResult.correct && ` (+${lastResult.xpEarned} XP)`}
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">{lastResult.explanation}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!showResult ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  <Sparkles size={20} />
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold hover:scale-[1.02] transition flex items-center justify-center gap-2"
                >
                  {isLastQuestion ? (
                    <>
                      <Trophy size={20} />
                      Finish Quiz
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      Next Question
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Stats Footer */}
            <div className="mt-6 bg-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-white/60">Correct: </span>
                  <span className="font-bold text-emerald-400">{stats.correctAnswers}</span>
                </div>
                <div>
                  <span className="text-white/60">Answered: </span>
                  <span className="font-bold text-cyan-400">{stats.questionsAnswered}</span>
                </div>
                <div>
                  <span className="text-white/60">Score: </span>
                  <span className="font-bold text-white">{Math.round(stats.score * 100)}%</span>
                </div>
              </div>
              <div className="text-xs text-white/40">
                Max XP: {getTotalPossibleXP()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
