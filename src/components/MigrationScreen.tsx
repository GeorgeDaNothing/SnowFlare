import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Database, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { isMigrationComplete, hasLegacyData, runMigration, type MigrationProgress } from '@/lib/migrate';

interface MigrationScreenProps {
  onComplete: () => void;
}

export function MigrationScreen({ onComplete }: MigrationScreenProps) {
  const [progress, setProgress] = useState<MigrationProgress>({
    phase: 'checking',
    message: 'Checking for legacy data...',
    total: 0,
    current: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function doMigrate() {
      if (isMigrationComplete() || !hasLegacyData()) {
        onComplete();
        return;
      }

      for await (const p of runMigration()) {
        if (cancelled) return;
        setProgress(p);
      }

      if (!cancelled) {
        // Brief pause so user sees "complete" message
        setTimeout(onComplete, 800);
      }
    }

    doMigrate();
    return () => { cancelled = true; };
  }, [onComplete]);

  const isError = progress.phase === 'error';
  const isComplete = progress.phase === 'complete';
  const showProgress = progress.total > 0;
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-on-primary mb-4">
            {isError ? <AlertTriangle className="w-8 h-8" /> : isComplete ? <CheckCircle2 className="w-8 h-8" /> : <Database className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-bold text-on-surface">
            {isError ? 'Migration Issue' : isComplete ? 'All Set!' : 'Upgrading Storage'}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {isError
              ? 'We encountered an issue while migrating your data.'
              : isComplete
              ? 'Your data has been moved to the server.'
              : 'Moving your local data to the server for better security and syncing.'}
          </p>
        </div>

        <div className="bg-surface-container-low rounded-2xl p-6 shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-4">
            {isError ? (
              <AlertTriangle className="w-5 h-5 text-error shrink-0" />
            ) : isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            ) : (
              <Loader2 className="w-5 h-5 text-primary shrink-0 animate-spin" />
            )}
            <span className="text-sm font-medium text-on-surface">{progress.message}</span>
          </div>

          {showProgress && !isError && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-on-surface-variant">
                <span>{progress.current} of {progress.total}</span>
                <span>{percent}%</span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  className="h-full bg-primary rounded-full"
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {isError && (
            <button
              onClick={onComplete}
              className="w-full mt-4 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Continue to App
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
