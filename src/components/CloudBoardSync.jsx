import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/apiClient';
import { ui } from '../utils/uiTheme';
import {
    ACTIVE_BOARD_CHANGED_EVENT,
    DEFAULT_BOARD_NAME,
    boardHasCustomisations,
    encodeCurrentBoard,
    formatBoardTimestamp,
    getActiveBoardId,
    hasBeenPromptedToUpload,
    markPromptedToUpload,
    setActiveBoardId,
} from '../utils/cloudBoards';

// The account-aware strip above the draft board.
//
// Accounts are optional, so this stays quiet: signed-out visitors get a single
// dismissible line, and signed-in users get one button. The board itself is
// always the localStorage copy — saving to the account is explicit, never
// automatic, so a stray click can't overwrite a board someone spent an hour on.
const CloudBoardSync = ({ darkMode, players, scoringFormat }) => {
    const { user, isAuthenticated, isLoading, isOffline } = useAuth();

    const [activeBoard, setActiveBoard] = useState(null);
    const [checked, setChecked] = useState(false);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);
    const [showUploadPrompt, setShowUploadPrompt] = useState(false);
    const [dismissedSignedOut, setDismissedSignedOut] = useState(false);

    const loadBoards = useCallback(async (signal) => {
        try {
            const data = await api.listBoards(signal);
            if (signal?.aborted) return;

            const activeId = getActiveBoardId();
            const match = data.boards.find((board) => board.id === activeId) || null;
            setActiveBoard(match);
            // The remembered id points at a board that no longer exists.
            if (activeId && !match) setActiveBoardId(null);

            // Offer to upload only when there is something worth uploading and
            // nothing on the account yet — never overwrite an existing board.
            if (
                data.boards.length === 0
                && !hasBeenPromptedToUpload(user.id)
                && boardHasCustomisations(players)
            ) {
                setShowUploadPrompt(true);
            }
        } catch {
            // A failure here just means no sync affordance this session; the
            // board is local and works regardless.
        } finally {
            if (!signal?.aborted) setChecked(true);
        }
        // `players` is read only at the moment of the check; re-running this on
        // every board edit would spam the API.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    useEffect(() => {
        if (!isAuthenticated) {
            setActiveBoard(null);
            setShowUploadPrompt(false);
            setChecked(false);
            return undefined;
        }

        const controller = new AbortController();
        loadBoards(controller.signal);
        return () => controller.abort();
    }, [isAuthenticated, loadBoards]);

    useEffect(() => {
        const handleActiveBoardChange = (event) => {
            if (!event.detail?.id) {
                setActiveBoard(null);
                setStatus(null);
            }
        };
        window.addEventListener(ACTIVE_BOARD_CHANGED_EVENT, handleActiveBoardChange);
        return () => window.removeEventListener(ACTIVE_BOARD_CHANGED_EVENT, handleActiveBoardChange);
    }, []);

    const handleUpload = async () => {
        setSaving(true);
        try {
            const { code, playerCount } = encodeCurrentBoard(players, scoringFormat);
            const data = await api.createBoard({ name: DEFAULT_BOARD_NAME, code, playerCount });
            setActiveBoardId(data.board.id);
            setActiveBoard(data.board);
            markPromptedToUpload(user.id);
            setShowUploadPrompt(false);
            setStatus({ tone: 'success', text: 'Board saved to your account.' });
        } catch (error) {
            setStatus({ tone: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDismissUpload = () => {
        markPromptedToUpload(user.id);
        setShowUploadPrompt(false);
    };

    const handleQuickSave = async () => {
        setSaving(true);
        setStatus(null);

        try {
            const { code, playerCount } = encodeCurrentBoard(players, scoringFormat);

            if (activeBoard) {
                await api.updateBoard(activeBoard.id, { code, playerCount });
                setActiveBoard({ ...activeBoard, updatedAt: new Date().toISOString(), playerCount });
                setStatus({ tone: 'success', text: `Saved to "${activeBoard.name}".` });
            } else {
                const data = await api.createBoard({ name: DEFAULT_BOARD_NAME, code, playerCount });
                setActiveBoardId(data.board.id);
                setActiveBoard(data.board);
                setStatus({ tone: 'success', text: 'Board saved to your account.' });
            }
        } catch (error) {
            setStatus({ tone: 'error', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    // Don't flash a "sign in" pitch before the session check has resolved —
    // or at all when there is no API answering, which is the case for a plain
    // `npm start`. Pitching an account that cannot be created is worse than
    // saying nothing.
    if (isLoading || isOffline) return null;

    if (!isAuthenticated) {
        if (dismissedSignedOut) return null;

        return (
            <div className={`mb-5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                darkMode ? 'border-white/[0.06] bg-slate-900/50' : 'border-slate-200/80 bg-white/90'
            }`}>
                <div className="min-w-0">
                    <p className={`text-sm font-semibold ${ui.heading(darkMode)}`}>
                        Save this board to an account
                    </p>
                    <p className={`mt-0.5 text-sm ${ui.muted(darkMode)}`}>
                        Free, and it keeps your tiers on every device. Your board stays in this browser either way.
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <Link to="/signup" className={ui.btnPrimary()}>Create account</Link>
                    <Link to="/login" className={ui.btn(darkMode)}>Sign in</Link>
                    <button
                        type="button"
                        onClick={() => setDismissedSignedOut(true)}
                        className={`${ui.btn(darkMode)} px-2.5`}
                        aria-label="Dismiss"
                    >
                        ✕
                    </button>
                </div>
            </div>
        );
    }

    if (showUploadPrompt) {
        return (
            <div className={`mb-5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                darkMode ? 'border-emerald-500/25 bg-emerald-500/[0.07]' : 'border-emerald-200 bg-emerald-50'
            }`}>
                <div className="min-w-0">
                    <p className={`text-sm font-semibold ${ui.heading(darkMode)}`}>
                        Save the board you already have?
                    </p>
                    <p className={`mt-0.5 text-sm ${ui.muted(darkMode)}`}>
                        You have tiers set up in this browser but nothing saved to your account yet.
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleUpload}
                        disabled={saving}
                        className={`${ui.btnPrimary()} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                        {saving ? 'Saving…' : 'Save to my account'}
                    </button>
                    <button type="button" onClick={handleDismissUpload} className={ui.btn(darkMode)}>
                        Not now
                    </button>
                </div>
            </div>
        );
    }

    if (!checked) return null;

    return (
        <div className={`mb-5 flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${
            darkMode ? 'border-white/[0.06] bg-slate-900/50' : 'border-slate-200/80 bg-white/90'
        }`}>
            <div className="min-w-0">
                {activeBoard && (
                    <>
                        <p className={`truncate text-sm font-semibold ${ui.heading(darkMode)}`}>
                            {activeBoard.name}
                        </p>
                        <p className={`mt-0.5 text-xs ${ui.muted(darkMode)}`}>
                            Last saved {formatBoardTimestamp(activeBoard.updatedAt)} · changes are not saved automatically
                        </p>
                    </>
                )}

                {status && (
                    <p className={`mt-1 text-xs font-medium ${
                        status.tone === 'error'
                            ? (darkMode ? 'text-rose-300' : 'text-rose-600')
                            : (darkMode ? 'text-emerald-300' : 'text-emerald-600')
                    }`} role={status.tone === 'error' ? 'alert' : 'status'} aria-live="polite">
                        {status.text}
                    </p>
                )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
                <button
                    type="button"
                    onClick={handleQuickSave}
                    disabled={saving}
                    className={`${ui.btnPrimary()} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    {saving ? 'Saving…' : activeBoard ? 'Save changes' : 'Save board'}
                </button>
                <Link to="/profile" className={ui.btn(darkMode)}>
                    Manage boards
                </Link>
            </div>
        </div>
    );
};

export default CloudBoardSync;
