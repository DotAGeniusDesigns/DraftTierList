import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/apiClient';
import { ui } from '../utils/uiTheme';
import {
    DEFAULT_BOARD_NAME,
    encodeCurrentBoard,
    formatBoardTimestamp,
    getActiveBoardId,
    setActiveBoardId,
} from '../utils/cloudBoards';

// Manages the boards saved to the account: save the current one, overwrite an
// existing one, load, rename, delete.
const SavedBoardsPanel = ({ darkMode, players, onLoadBoard }) => {
    const navigate = useNavigate();

    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    // Board id currently being acted on, so only its own row shows a spinner.
    const [busyId, setBusyId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [newBoardName, setNewBoardName] = useState(DEFAULT_BOARD_NAME);
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const activeBoardId = getActiveBoardId();

    const refresh = useCallback(async (signal) => {
        try {
            const data = await api.listBoards(signal);
            setBoards(data.boards);
            setError(null);
        } catch (err) {
            if (err.name === 'AbortError') return;
            setError(err.message);
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        refresh(controller.signal);
        return () => controller.abort();
    }, [refresh]);

    const handleSaveNew = async (event) => {
        event.preventDefault();
        if (saving) return;

        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            const { code, playerCount } = encodeCurrentBoard(players);
            const data = await api.createBoard({ name: newBoardName.trim(), code, playerCount });
            setActiveBoardId(data.board.id);
            setNewBoardName(DEFAULT_BOARD_NAME);
            setMessage(`Saved "${data.board.name}".`);
            await refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleOverwrite = async (board) => {
        setBusyId(board.id);
        setMessage(null);
        setError(null);

        try {
            const { code, playerCount } = encodeCurrentBoard(players);
            await api.updateBoard(board.id, { code, playerCount });
            setActiveBoardId(board.id);
            setMessage(`Updated "${board.name}" with your current board.`);
            await refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleLoad = async (board) => {
        setBusyId(board.id);
        setMessage(null);
        setError(null);

        try {
            const data = await api.getBoard(board.id);
            onLoadBoard(data.board.code, board.name);
            setActiveBoardId(board.id);
            navigate('/draft-board');
        } catch (err) {
            setError(err.message);
            setBusyId(null);
        }
    };

    const handleRename = async (board) => {
        const name = renameValue.trim();
        if (!name || name === board.name) {
            setRenamingId(null);
            return;
        }

        setBusyId(board.id);
        setError(null);

        try {
            await api.updateBoard(board.id, { name });
            setRenamingId(null);
            await refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (board) => {
        setBusyId(board.id);
        setMessage(null);
        setError(null);

        try {
            await api.deleteBoard(board.id);
            if (activeBoardId === board.id) setActiveBoardId(null);
            setConfirmDeleteId(null);
            setMessage(`Deleted "${board.name}".`);
            await refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <section className={`${ui.card(darkMode)} p-5 sm:p-6`}>
            <div className="mb-5">
                <h2 className={`text-lg font-bold ${ui.heading(darkMode)}`}>Saved boards</h2>
                <p className={`mt-1 text-sm leading-relaxed ${ui.muted(darkMode)}`}>
                    Your tiers, ordering, tier names and flags are stored on your account. Player
                    stats and photos are always pulled fresh, so a saved board never goes stale.
                </p>
            </div>

            {message && <div className={`${ui.alert(darkMode, 'success')} mb-4`} role="status">{message}</div>}
            {error && <div className={`${ui.alert(darkMode, 'error')} mb-4`} role="alert">{error}</div>}

            <form onSubmit={handleSaveNew} className="mb-5 flex flex-col gap-3 sm:flex-row">
                <input
                    type="text"
                    value={newBoardName}
                    onChange={(event) => setNewBoardName(event.target.value)}
                    placeholder="Board name"
                    maxLength={60}
                    disabled={saving}
                    className={ui.input(darkMode)}
                    aria-label="Name for the new saved board"
                />
                <button
                    type="submit"
                    disabled={saving || !newBoardName.trim()}
                    className={`${ui.btnPrimary()} shrink-0 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    {saving ? 'Saving…' : 'Save current board'}
                </button>
            </form>

            {loading ? (
                <p className={`text-sm ${ui.muted(darkMode)}`}>Loading your boards…</p>
            ) : boards.length === 0 ? (
                <div className={`${ui.cardInset(darkMode)} p-5 text-center`}>
                    <p className={`text-sm ${ui.muted(darkMode)}`}>
                        No saved boards yet. Save your current board above to get started.
                    </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {boards.map((board) => {
                        const isBusy = busyId === board.id;
                        const isActive = activeBoardId === board.id;

                        return (
                            <li key={board.id} className={`${ui.cardInset(darkMode)} p-4`}>
                                {renamingId === board.id ? (
                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <input
                                            type="text"
                                            value={renameValue}
                                            onChange={(event) => setRenameValue(event.target.value)}
                                            maxLength={60}
                                            autoFocus
                                            className={ui.input(darkMode)}
                                            aria-label={`New name for ${board.name}`}
                                        />
                                        <div className="flex shrink-0 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleRename(board)}
                                                disabled={isBusy}
                                                className={ui.btnPrimary()}
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRenamingId(null)}
                                                className={ui.btn(darkMode)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className={`truncate font-semibold ${ui.heading(darkMode)}`}>
                                                    {board.name}
                                                </p>
                                                {isActive && (
                                                    <span className={ui.statPill(darkMode, 'success')}>Active</span>
                                                )}
                                            </div>
                                            <p className={`mt-0.5 text-xs ${ui.muted(darkMode)}`}>
                                                {board.playerCount} players · updated {formatBoardTimestamp(board.updatedAt)}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleLoad(board)}
                                                disabled={isBusy}
                                                className={ui.btn(darkMode)}
                                            >
                                                {isBusy ? '…' : 'Load'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleOverwrite(board)}
                                                disabled={isBusy}
                                                className={ui.btn(darkMode)}
                                                title="Replace this saved board with the board you are working on now"
                                            >
                                                Update
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRenamingId(board.id);
                                                    setRenameValue(board.name);
                                                }}
                                                disabled={isBusy}
                                                className={ui.btn(darkMode)}
                                            >
                                                Rename
                                            </button>
                                            {confirmDeleteId === board.id ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(board)}
                                                        disabled={isBusy}
                                                        className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
                                                    >
                                                        Confirm
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className={ui.btn(darkMode)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setConfirmDeleteId(board.id)}
                                                    disabled={isBusy}
                                                    className={`${ui.btn(darkMode)} ${
                                                        darkMode ? 'text-rose-300' : 'text-rose-600'
                                                    }`}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
};

export default SavedBoardsPanel;
