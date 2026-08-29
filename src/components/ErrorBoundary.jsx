import React from 'react';
import { TIER_NAMES_KEY } from '../utils/tierNames';

// Keys that hold user-generated board state. A corrupt value in any of these
// can throw during render, which would otherwise leave a permanent white screen
// that a reload cannot fix — so the fallback offers to clear them.
// Saved backups are deliberately left alone: they are the recovery path.
const BOARD_KEYS = [
    'fantasy-football-players',
    'position-filters',
    'flag-filters',
    'scoring-format',
    'hide-drafted',
    'draft-lottery-order',
    TIER_NAMES_KEY,
];

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Unhandled error:', error, errorInfo);
    }

    handleResetBoard = () => {
        try {
            BOARD_KEYS.forEach((key) => window.localStorage.removeItem(key));
        } catch (e) {
            console.error('Failed to clear saved board:', e);
        }
        window.location.replace('/draft-board');
    };

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
                <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-3xl">
                        ⚠️
                    </div>
                    <h1 className="mb-2 text-xl font-bold text-white">Something went wrong</h1>
                    <p className="mb-5 text-sm leading-relaxed text-slate-400">
                        Fantasy Toolkit hit an unexpected error. Reloading usually fixes it. If the
                        error keeps coming back, your saved draft board may be corrupted — resetting
                        it will clear your tiers and draft picks and start fresh from the default
                        rankings.
                    </p>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:from-emerald-400 hover:to-teal-400"
                        >
                            Reload page
                        </button>
                        <button
                            type="button"
                            onClick={this.handleResetBoard}
                            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-slate-700/80"
                        >
                            Reset my board
                        </button>
                    </div>

                    {error?.message && (
                        <details className="mt-6 text-xs text-slate-500">
                            <summary className="cursor-pointer select-none hover:text-slate-300">
                                Technical details
                            </summary>
                            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950/60 p-3 font-mono text-[11px] leading-relaxed">
                                {error.message}
                            </pre>
                        </details>
                    )}
                </div>
            </div>
        );
    }
}

export default ErrorBoundary;
