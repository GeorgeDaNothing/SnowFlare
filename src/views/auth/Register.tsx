import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const SECURITY_QUESTIONS = [
  'What was the name of your first pet?',
  'In what city were you born?',
  "What is your mother's maiden name?",
  'What was the make of your first car?',
  'What was your favorite food as a child?',
  'What is the name of your favorite childhood teacher?',
];

export function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [securityQuestions, setSecurityQuestions] = useState([
    { question: SECURITY_QUESTIONS[0], answer: '' },
    { question: SECURITY_QUESTIONS[1], answer: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = ['bg-error', 'bg-error', 'bg-secondary', 'bg-tertiary', 'bg-primary', 'bg-primary'];

  const validateStep1 = () => {
    if (!name.trim()) return 'Please enter your full name.';
    if (!email.trim()) return 'Please enter your email address.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
    if (password.length < 8) return 'Password must be at least 8 characters long.';
    if (passwordStrength < 3) return 'Please choose a stronger password.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return '';
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (securityQuestions.some((sq) => !sq.answer.trim())) {
      setError('Please answer all security questions.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(
        name,
        email,
        password,
        securityQuestions.map((sq) => ({ question: sq.question, answer: sq.answer }))
      );
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-on-primary mb-6">
            <Check className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface mb-2">Account Created!</h1>
          <p className="text-sm text-on-surface-variant mb-8">
            Your account has been created successfully. You can now sign in to get started.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

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
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">Create your account</h1>
          <p className="text-sm text-on-surface-variant mt-1">Join Horizon Pulse today</p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <div className={cn('flex-1 h-1.5 rounded-full transition-colors', step >= 1 ? 'bg-primary' : 'bg-surface-container-highest')} />
          <div className={cn('flex-1 h-1.5 rounded-full transition-colors', step >= 2 ? 'bg-primary' : 'bg-surface-container-highest')} />
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
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none border border-outline-variant/30 focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Email</label>
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none border border-outline-variant/30 focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                            className={cn('h-full rounded-full', strengthColors[passwordStrength])}
                          />
                        </div>
                        <span className="text-xs text-on-surface-variant">{strengthLabels[passwordStrength]}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className={cn(
                        'w-full pl-10 pr-10 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none border transition-colors',
                        confirmPassword && password !== confirmPassword
                          ? 'border-error focus:border-error'
                          : 'border-outline-variant/30 focus:border-primary'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <p className="text-sm text-on-surface-variant mb-4">
                  Set up security questions to help recover your account if you forget your password.
                </p>

                {securityQuestions.map((sq, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface">Security Question {idx + 1}</label>
                    <select
                      value={sq.question}
                      onChange={(e) => {
                        const updated = [...securityQuestions];
                        updated[idx].question = e.target.value;
                        setSecurityQuestions(updated);
                      }}
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface outline-none border border-outline-variant/30 focus:border-primary transition-colors"
                    >
                      {SECURITY_QUESTIONS.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={sq.answer}
                      onChange={(e) => {
                        const updated = [...securityQuestions];
                        updated[idx].answer = e.target.value;
                        setSecurityQuestions(updated);
                      }}
                      placeholder="Your answer"
                      className="w-full px-3 py-2.5 rounded-lg bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none border border-outline-variant/30 focus:border-primary transition-colors"
                    />
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
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
                        Create Account
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
