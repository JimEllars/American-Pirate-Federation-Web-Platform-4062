import React from 'react';
import SafeIcon from '../../common/SafeIcon';

/**
 * Reddit-style vote control. The score comes from the row; the member's own vote comes from
 * `forum_votes` (readable only by its owner). Nothing here invents a tally.
 */
export function VoteControl({ score = 0, value = 0, onVote, disabled = false, onRequireAuth, label = 'vote' }) {
  const handle = (direction) => {
    if (disabled) {
      onRequireAuth?.();
      return;
    }
    onVote?.(direction);
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-0.5" aria-label={`Score ${score}`}>
      <button
        type="button"
        onClick={() => handle(1)}
        aria-label="Upvote"
        aria-pressed={value === 1}
        title={disabled ? 'Sign in to vote' : 'Upvote'}
        className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
          value === 1
            ? 'bg-emerald-400/10 text-emerald-300'
            : 'text-ink-dim hover:bg-white/[0.06] hover:text-white'
        }`}
      >
        <SafeIcon name="ArrowUp" className="h-4 w-4" />
      </button>
      <span className="font-mono text-xs text-ink-muted" aria-live="polite">{score}</span>
      <button
        type="button"
        onClick={() => handle(-1)}
        aria-label="Downvote"
        aria-pressed={value === -1}
        title={disabled ? 'Sign in to vote' : 'Downvote'}
        className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
          value === -1
            ? 'bg-red-400/10 text-red-300'
            : 'text-ink-dim hover:bg-white/[0.06] hover:text-white'
        }`}
      >
        <SafeIcon name="ArrowDown" className="h-4 w-4" />
      </button>
    </div>
  );
}
