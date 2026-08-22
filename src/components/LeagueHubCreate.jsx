import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/apiClient';
import { ui } from '../utils/uiTheme';

// The "your league hubs" page: create a hub (just a name/description — you
// add managers on its manage page), and see/delete the hubs you already
// have. Creating and managing a hub requires sign-in (this page sits behind
// RequireAuth in App.jsx); the resulting /league/:id page itself is public.
const LeagueHubCreate = ({ darkMode }) => {
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState(null);

    const [nameInput, setNameInput] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState(null);

    const [busyId, setBusyId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const refresh = useCallback(async (signal) => {
        try {
            const data = await api.listLeagueHubs(signal);
            setHubs(data.hubs);
            setListError(null);
        } catch (err) {
            if (err.name === 'AbortError') return;
            setListError(err.message);
        } finally {
            if (!signal?.aborted) setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        refresh(controller.signal);
        return () => controller.abort();
    }, [refresh]);

    const handleCreate = async (event) => {
        event.preventDefault();
        if (creating) return;

        setCreating(true);
        setCreateError(null);

        try {
            await api.createLeagueHub({ name: nameInput.trim() });
            setNameInput('');
            await refresh();
        } catch (err) {
            setCreateError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (hub) => {
        setBusyId(hub.id);
        try {
            await api.deleteLeagueHub(hub.id);
            setConfirmDeleteId(null);
            await refresh();
        } catch (err) {
            setListError(err.message);
        } finally {
            setBusyId(null);
        }
    };

    const shareUrl = (id) => `${window.location.origin}/league/${id}`;

    return (
        <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-10">
            <div className="mb-6">
                <h1 className={`font-display text-2xl font-bold tracking-tight sm:text-3xl ${ui.heading(darkMode)}`}>
                    <span className="text-gradient-brand">League Hub</span>
                </h1>
                <p className={`mt-1.5 max-w-2xl text-sm sm:text-base ${ui.muted(darkMode)}`}>
                    Build a page for your league — up to 16 managers, each with a photo,
                    a blurb, and their roster — and share it with one link.
                </p>
            </div>

            <section className={`${ui.card(darkMode)} p-5 sm:p-6`}>
                <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row">
                    <input
                        type="text"
                        value={nameInput}
                        onChange={(event) => setNameInput(event.target.value)}
                        placeholder="League name"
                        maxLength={60}
                        disabled={creating}
                        className={ui.input(darkMode, Boolean(createError))}
                        aria-label="League name"
                    />
                    <button
                        type="submit"
                        disabled={creating || !nameInput.trim()}
                        className={`${ui.btnPrimary()} shrink-0 disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                        {creating ? 'Creating…' : 'Create hub'}
                    </button>
                </form>
                {createError && <p className={ui.fieldError(darkMode)}>{createError}</p>}
            </section>

            <section className="mt-6">
                <h2 className={`mb-3 text-lg font-bold ${ui.heading(darkMode)}`}>Your league hubs</h2>

                {listError && <div className={`${ui.alert(darkMode, 'error')} mb-4`} role="alert">{listError}</div>}

                {loading ? (
                    <p className={`text-sm ${ui.muted(darkMode)}`}>Loading your league hubs…</p>
                ) : hubs.length === 0 ? (
                    <div className={`${ui.cardInset(darkMode)} p-5 text-center`}>
                        <p className={`text-sm ${ui.muted(darkMode)}`}>
                            No league hubs yet. Create one above to get started.
                        </p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {hubs.map((hub) => {
                            const isBusy = busyId === hub.id;
                            return (
                                <li key={hub.id} className={`${ui.cardInset(darkMode)} p-4`}>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <Link
                                                to={`/league-hub/${hub.id}`}
                                                className={`truncate font-semibold hover:underline ${ui.heading(darkMode)}`}
                                            >
                                                {hub.name}
                                            </Link>
                                            <p className={`mt-0.5 truncate text-xs ${ui.muted(darkMode)}`}>
                                                {shareUrl(hub.id)}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            <Link to={`/league-hub/${hub.id}`} className={ui.btn(darkMode)}>
                                                Manage
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => navigator.clipboard?.writeText(shareUrl(hub.id))}
                                                className={ui.btn(darkMode)}
                                            >
                                                Copy link
                                            </button>
                                            {confirmDeleteId === hub.id ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(hub)}
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
                                                    onClick={() => setConfirmDeleteId(hub.id)}
                                                    disabled={isBusy}
                                                    className={`${ui.btn(darkMode)} ${darkMode ? 'text-rose-300' : 'text-rose-600'}`}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
};

export default LeagueHubCreate;
