import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, ArrowLeft, ArrowRight, Check, HelpCircle, ShieldCheck, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function ForgotPassword() {
  const { requestPasswordReset, getSecurityQuestions, verifySecurityAnswers } = useAuth();
  const [step, setStep] = useState<'email' | 'questions' | 'token' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '']);
  const [resetToken, setResetToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const sqResult = getSecurityQuestions(email);
      if (sqResult.success && sqResult.questions) {
        setQuestions(sqResult.questions);
        setStep('questions');
      } else {
        const resetResult = requestPasswordReset(email);
        if (resetResult.success) {
          setResetToken(resetResult.token || '');
          setStep('token');
        } else {
          setError(resetResult.message);
        }
      }
      setIsSubmitting(false);
    }, 600);
  };

  const handleAnswersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (answers.some((a) => !a.trim())) {
      setError('Please answer all questions.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const result = verifySecurityAnswers(email, answers);
      if (result.success) {
        setResetToken(result.token || '');
        setStep('token');
      } else {
        setError(result.message);
      }
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-on-primary mb-4">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Forgot password?</h1>
          <p className="text-sm text-on-surface-variant mt-1">We'll help you get back into your account</p>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant/10">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-sm"
            >
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.form
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailSubmit}
                className="space-y-4"
              >
                <p className="text-sm text-on-surface-variant">
                  Enter your email address and we'll look up your account recovery options.
                </p>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none border border-outline-variant/30 focus:border-primary transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'questions' && (
              <motion.form
                key="questions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleAnswersSubmit}
                className="space-y-4"
              >
                <p className="text-sm text-on-surface-variant">
                  Answer your security questions to verify your identity.
                </p>
                {questions.map((q, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">{q}</label>
                    <input
                      type="text"
                      value={answers[idx]}
                      onChange={(e) => {
                        const updated = [...answers];
                        updated[idx] = e.target.value;
                        setAnswers(updated);
                      }}
                      placeholder="Your answer"
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none border border-outline-variant/30 focus:border-primary transition-colors"
                    />
                  </div>
                ))}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="flex-1 py-2.5 bg-surface-container-high text-on-surface font-semibold rounded-lg hover:bg-surface-container-highest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    ) : (
                      <>
                        Verify
                        <ShieldCheck className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}

            {step === 'token' && (
              <motion.div
                key="token"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-lg bg-tertiary-container text-on-tertiary-container text-sm">
                  <p className="font-medium mb-1">Recovery code generated!</p>
                  <p className="opacity-80 mb-3">
                    In a real app, this would be emailed to you. Use this code to reset your password:
                  </p>
                  <code className="block p-2 bg-surface-container-lowest rounded border border-outline-variant/30 font-mono text-xs break-all select-all">
                    {resetToken}
                  </code>
                </div>
                <Link
                  to={`/reset-password?token=${resetToken}`}
                  className="w-full py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Reset Password
                  <RotateCcw className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full py-2.5 bg-surface-container-high text-on-surface font-semibold rounded-lg hover:bg-surface-container-highest active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Start Over
                </button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-on-primary mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-on-surface">Email Sent</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Check your inbox for password reset instructions.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center mt-6">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
