'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { reviewApi } from '@/lib/api';
import { useRole } from '@/hooks/use-role';
import { useAuth } from '@/hooks/use-auth';
import { ContentStatusBadge } from '@/components/ui/content-status-badge';
import { Button } from '@/components/ui/button';
import { ContentStatus, Question, QuestionRevision } from '@/types';
import { ShieldCheck, CheckCircle, XCircle, GitCompare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function ModerationPage() {
  const t = useTranslations();
  const router = useRouter();
  const { loading } = useAuth();
  const { isModOrAdmin } = useRole();

  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);
  const [pendingRevisions, setPendingRevisions] = useState<QuestionRevision[]>([]);
  const [activeTab, setActiveTab] = useState<'questions' | 'revisions'>('questions');
  const [fetching, setFetching] = useState(true);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    type: 'question' | 'revision';
    id: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !isModOrAdmin) {
      router.replace('/');
    }
  }, [loading, isModOrAdmin, router]);

  useEffect(() => {
    if (!isModOrAdmin) return;
    reviewApi.getPending().then(({ questions, revisions }) => {
      setPendingQuestions(questions);
      setPendingRevisions(revisions);
    }).catch(() => {
      toast.error(t('common.error'));
    }).finally(() => setFetching(false));
  }, [isModOrAdmin]);

  async function handleApprove(type: 'question' | 'revision', id: string) {
    setSubmitting(true);
    try {
      if (type === 'question') {
        await reviewApi.approveQuestion(id);
        setPendingQuestions(prev => prev.filter(q => q.id !== id));
      } else {
        await reviewApi.approveRevision(id);
        setPendingRevisions(prev => prev.filter(r => r.id !== id));
      }
      toast.success(t('moderation.approveSuccess'));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  function openRejectDialog(type: 'question' | 'revision', id: string) {
    setPendingAction({ type, id });
    setRejectNote('');
    setRejectDialogOpen(true);
  }

  async function handleReject() {
    if (!pendingAction || !rejectNote.trim()) return;
    setSubmitting(true);
    try {
      if (pendingAction.type === 'question') {
        await reviewApi.rejectQuestion(pendingAction.id, rejectNote.trim());
        setPendingQuestions(prev => prev.filter(q => q.id !== pendingAction.id));
      } else {
        await reviewApi.rejectRevision(pendingAction.id, rejectNote.trim());
        setPendingRevisions(prev => prev.filter(r => r.id !== pendingAction.id));
      }
      toast.success(t('moderation.rejectSuccess'));
      setRejectDialogOpen(false);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isModOrAdmin) return null;

  const totalPending = pendingQuestions.length + pendingRevisions.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-amber-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('moderation.title')}
        </h1>
        {totalPending > 0 && (
          <span className="rounded-full bg-amber-100 dark:bg-amber-500/10 px-2.5 py-0.5 text-sm font-medium text-amber-700 dark:text-amber-400">
            {totalPending}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'questions'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('moderation.pendingQuestions')} ({pendingQuestions.length})
        </button>
        <button
          onClick={() => setActiveTab('revisions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'revisions'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          {t('moderation.pendingRevisions')} ({pendingRevisions.length})
        </button>
      </div>

      {/* Pending Questions */}
      {activeTab === 'questions' && (
        <div className="space-y-3">
          {pendingQuestions.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-12">
              {t('moderation.noItems')}
            </p>
          ) : (
            pendingQuestions.map(q => (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ContentStatusBadge status={ContentStatus.PENDING_REVIEW} />
                      <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">
                        {q.level}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-900 dark:text-white truncate">{q.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('moderation.submittedAt', { date: new Date(q.createdAt).toLocaleDateString() })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                      onClick={() => handleApprove('question', q.id)}
                      disabled={submitting}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {t('moderation.approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                      onClick={() => openRejectDialog('question', q.id)}
                      disabled={submitting}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {t('moderation.reject')}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending Revisions */}
      {activeTab === 'revisions' && (
        <div className="space-y-3">
          {pendingRevisions.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-12">
              {t('moderation.noItems')}
            </p>
          ) : (
            pendingRevisions.map(r => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ContentStatusBadge status={ContentStatus.PENDING_REVIEW} />
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <GitCompare className="h-3 w-3" />
                        {t('moderation.revisionOf')}
                      </span>
                    </div>
                    <h3 className="font-medium text-slate-900 dark:text-white truncate">{r.title}</h3>
                    {r.submitter && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('moderation.submittedBy', { name: r.submitter.name })} &middot;{' '}
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    )}
                    {r.question && (
                      <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-2">
                          <p className="font-medium text-slate-500 dark:text-slate-400 mb-1">{t('moderation.original')}</p>
                          <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{r.question.title}</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-2">
                          <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">{t('moderation.proposed')}</p>
                          <p className="text-slate-700 dark:text-slate-300 line-clamp-2">{r.title}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                      onClick={() => handleApprove('revision', r.id)}
                      disabled={submitting}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {t('moderation.approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                      onClick={() => openRejectDialog('revision', r.id)}
                      disabled={submitting}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {t('moderation.reject')}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('moderation.rejectTitle')}</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={t('moderation.rejectNotePlaceholder')}
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectNote.trim() || submitting}
            >
              {t('moderation.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
