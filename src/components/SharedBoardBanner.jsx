import React from 'react';
import { ui } from '../utils/uiTheme';

const formatSharedAt = (date) => {
    if (!date) return null;
    try {
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        return null;
    }
};

// Shown when someone opens a /draft-board?board=... link. The shared board is
// never applied silently — overwriting a visitor's own tiers is destructive, so
// it stays a choice.
const SharedBoardBanner = ({ darkMode, board, onApply, onDismiss }) => {
    if (!board) return null;

    const sharedAt = formatSharedAt(board.sharedAt);

    return (
        <div
            className={`mb-5 overflow-hidden rounded-2xl border ${
                darkMode
                    ? 'border-emerald-500/25 bg-emerald-500/[0.07]'
                    : 'border-emerald-300/70 bg-emerald-50/80'
            }`}
        >
            <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-lg" aria-hidden="true">🔗</span>
                            <p className={`text-sm font-bold ${ui.heading(darkMode)}`}>
                                Someone shared a draft board with you
                            </p>
                        </div>

                        <p className={`mt-1.5 text-sm ${ui.muted(darkMode)}`}>
                            {board.sharedCount} ranked players
                            {sharedAt ? ` • shared ${sharedAt}` : ''}
                        </p>

                        {board.preview?.length > 0 && (
                            <p className={`mt-2 text-xs ${ui.muted(darkMode)}`}>
                                Starts with: {board.preview.join(', ')}…
                            </p>
                        )}

                        {board.missingCount > 0 && (
                            <p className={`mt-2 text-xs ${ui.muted(darkMode)}`}>
                                {board.missingCount} player{board.missingCount === 1 ? '' : 's'} from
                                this board {board.missingCount === 1 ? 'is' : 'are'} no longer in the
                                database and will be skipped.
                            </p>
                        )}

                        <p className={`mt-2.5 text-xs ${ui.muted(darkMode)}`}>
                            Using it replaces your current board. Your existing board is backed up
                            first, so you can restore it from Backups.
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                        <button type="button" onClick={onApply} className={ui.btnPrimary()}>
                            Use this board
                        </button>
                        <button type="button" onClick={onDismiss} className={ui.btn(darkMode)}>
                            Keep mine
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SharedBoardBanner;
