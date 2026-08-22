import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../utils/apiClient';
import { ui } from '../utils/uiTheme';
import { getPositionTagProps } from '../utils/playerStyles';
import { usePositionColors } from '../context/PositionColorsContext';
import { initialPlayers } from '../utils/playerData';
import { playerDatabase } from '../utils/playerDatabase';
import { compressImageFile } from '../utils/imageUpload';
import DraftBoardSearch from './DraftBoardSearch';

const MAX_MANAGERS = 16;

const ManagerAvatar = ({ imageData, name, size = 'h-16 w-16' }) => (
    <div className={`${size} shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800`}>
        {imageData ? (
            <img src={imageData} alt="" className="h-full w-full object-cover" />
        ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500">
                {(name || '?').slice(0, 2).toUpperCase()}
            </div>
        )}
    </div>
);

// Add/edit form for one manager, shown as a modal. Roster is edited as a
// list of this app's own player records (picked via the same search used on
// the draft board) but saved as just their ids.
const ManagerFormModal = ({ darkMode, manager, onClose, onSave }) => {
    const { colors: positionColors } = usePositionColors();
    const [name, setName] = useState(manager?.name || '');
    const [description, setDescription] = useState(manager?.description || '');
    const [imageData, setImageData] = useState(manager?.imageData || null);
    const [roster, setRoster] = useState(
        () => (manager?.roster || []).map((id) => playerDatabase[id]).filter(Boolean)
    );
    const [imageError, setImageError] = useState(null);
    const [compressing, setCompressing] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setImageError(null);
        setCompressing(true);
        try {
            const dataUrl = await compressImageFile(file);
            setImageData(dataUrl);
        } catch (err) {
            setImageError(err.message);
        } finally {
            setCompressing(false);
        }
    };

    const addPlayer = (player) => {
        setRoster((prev) => (prev.some((p) => p.id === player.id) ? prev : [...prev, player]));
    };

    const removePlayer = (playerId) => {
        setRoster((prev) => prev.filter((p) => p.id !== playerId));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (saving) return;

        setSaving(true);
        setSaveError(null);
        try {
            await onSave({
                name: name.trim(),
                description: description.trim(),
                imageData,
                roster: roster.map((p) => p.id),
            });
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={ui.modalOverlay}>
            <div className={`flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border p-6 shadow-2xl ${darkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                <div className="mb-5 flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${ui.heading(darkMode)}`}>
                        {manager ? 'Edit manager' : 'Add manager'}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${darkMode ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                        aria-label="Close"
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M4.28 4.28a.75.75 0 011.06 0L10 8.94l4.66-4.66a.75.75 0 111.06 1.06L11.06 10l4.66 4.66a.75.75 0 11-1.06 1.06L10 11.06l-4.66 4.66a.75.75 0 01-1.06-1.06L8.94 10 4.28 5.34a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
                    <div className="flex items-center gap-4">
                        <ManagerAvatar imageData={imageData} name={name} />
                        <div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={compressing}
                                className={ui.btn(darkMode)}
                            >
                                {compressing ? 'Processing…' : imageData ? 'Change photo' : 'Upload photo'}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                            {imageError && <p className={ui.fieldError(darkMode)}>{imageError}</p>}
                        </div>
                    </div>

                    <div>
                        <label className={ui.label(darkMode)}>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={60}
                            required
                            className={ui.input(darkMode)}
                        />
                    </div>

                    <div>
                        <label className={ui.label(darkMode)}>Description</label>
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            maxLength={300}
                            rows={3}
                            placeholder="A blurb about this manager or team..."
                            className={`${ui.input(darkMode)} resize-none`}
                        />
                    </div>

                    <div>
                        <label className={ui.label(darkMode)}>Roster</label>
                        <DraftBoardSearch
                            players={initialPlayers}
                            darkMode={darkMode}
                            onSelectPlayer={addPlayer}
                        />
                        {roster.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                                {roster.map((player) => (
                                    <li
                                        key={player.id}
                                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 ${ui.cardInset(darkMode)}`}
                                    >
                                        <span {...getPositionTagProps(player.position, { darkMode, colors: positionColors })}>
                                            {player.position}
                                        </span>
                                        <span className={`min-w-0 flex-1 truncate text-sm ${ui.heading(darkMode)}`}>
                                            {player.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removePlayer(player.id)}
                                            className={`shrink-0 rounded p-1 transition ${darkMode ? 'text-slate-500 hover:bg-white/5 hover:text-rose-400' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}
                                            aria-label={`Remove ${player.name}`}
                                        >
                                            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                                <path fillRule="evenodd" d="M4.28 4.28a.75.75 0 011.06 0L10 8.94l4.66-4.66a.75.75 0 111.06 1.06L11.06 10l4.66 4.66a.75.75 0 11-1.06 1.06L10 11.06l-4.66 4.66a.75.75 0 01-1.06-1.06L8.94 10 4.28 5.34a.75.75 0 010-1.06z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {saveError && <div className={ui.alert(darkMode, 'error')}>{saveError}</div>}

                    <div className="mt-1 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className={ui.btn(darkMode)}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || compressing || !name.trim()}
                            className={`${ui.btnPrimary()} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            {saving ? 'Saving…' : 'Save manager'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LeagueHubManage = ({ darkMode }) => {
    const { id } = useParams();

    const [hub, setHub] = useState(null);
    const [loadError, setLoadError] = useState(null);

    const [nameInput, setNameInput] = useState('');
    const [descriptionInput, setDescriptionInput] = useState('');
    const [editingHeader, setEditingHeader] = useState(false);
    const [savingHeader, setSavingHeader] = useState(false);
    const [headerError, setHeaderError] = useState(null);

    const [modalState, setModalState] = useState(null); // null | 'create' | manager object
    const [managerError, setManagerError] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [busyManagerId, setBusyManagerId] = useState(null);

    const refresh = useCallback(async (signal) => {
        try {
            const data = await api.getLeagueHub(id, signal);
            setHub(data.hub);
            setNameInput(data.hub.name);
            setDescriptionInput(data.hub.description || '');
            setLoadError(null);
        } catch (err) {
            if (err.name !== 'AbortError') setLoadError(err.message);
        }
    }, [id]);

    useEffect(() => {
        const controller = new AbortController();
        refresh(controller.signal);
        return () => controller.abort();
    }, [refresh]);

    const handleSaveHeader = async (event) => {
        event.preventDefault();
        setSavingHeader(true);
        setHeaderError(null);
        try {
            const data = await api.updateLeagueHub(id, { name: nameInput.trim(), description: descriptionInput.trim() });
            setHub((prev) => ({ ...prev, ...data.hub }));
            setEditingHeader(false);
        } catch (err) {
            setHeaderError(err.message);
        } finally {
            setSavingHeader(false);
        }
    };

    const handleSaveManager = async (payload) => {
        if (modalState === 'create') {
            const data = await api.createLeagueHubManager(id, payload);
            setHub((prev) => ({ ...prev, managers: [...prev.managers, data.manager] }));
        } else {
            const data = await api.updateLeagueHubManager(id, modalState.id, payload);
            setHub((prev) => ({
                ...prev,
                managers: prev.managers.map((m) => (m.id === modalState.id ? data.manager : m)),
            }));
        }
        setModalState(null);
    };

    const handleDeleteManager = async (manager) => {
        setBusyManagerId(manager.id);
        setManagerError(null);
        try {
            await api.deleteLeagueHubManager(id, manager.id);
            setHub((prev) => ({ ...prev, managers: prev.managers.filter((m) => m.id !== manager.id) }));
            setConfirmDeleteId(null);
        } catch (err) {
            setManagerError(err.message);
        } finally {
            setBusyManagerId(null);
        }
    };

    if (loadError) {
        return (
            <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
                <div className={`${ui.card(darkMode)} p-8`}>
                    <h1 className={`font-display text-2xl font-bold ${ui.heading(darkMode)}`}>
                        This league hub doesn&apos;t exist
                    </h1>
                    <p className={`mx-auto mt-3 max-w-md text-sm ${ui.muted(darkMode)}`}>{loadError}</p>
                    <Link to="/league-hub" className={`${ui.btnPrimary()} mt-6 inline-flex`}>
                        Back to your league hubs
                    </Link>
                </div>
            </div>
        );
    }

    if (!hub) {
        return (
            <div className="container mx-auto max-w-5xl px-4 py-16 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <p className={`mt-4 text-sm ${ui.muted(darkMode)}`} role="status">Loading…</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    {editingHeader ? (
                        <form onSubmit={handleSaveHeader} className="max-w-lg space-y-3">
                            <input
                                type="text"
                                value={nameInput}
                                onChange={(event) => setNameInput(event.target.value)}
                                maxLength={60}
                                className={ui.input(darkMode)}
                                aria-label="League name"
                            />
                            <textarea
                                value={descriptionInput}
                                onChange={(event) => setDescriptionInput(event.target.value)}
                                maxLength={300}
                                rows={2}
                                placeholder="A short description of your league..."
                                className={`${ui.input(darkMode)} resize-none`}
                                aria-label="League description"
                            />
                            {headerError && <p className={ui.fieldError(darkMode)}>{headerError}</p>}
                            <div className="flex gap-2">
                                <button type="submit" disabled={savingHeader} className={ui.btnPrimary()}>
                                    {savingHeader ? 'Saving…' : 'Save'}
                                </button>
                                <button type="button" onClick={() => setEditingHeader(false)} className={ui.btn(darkMode)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <h1 className={`font-display text-2xl font-bold tracking-tight sm:text-3xl ${ui.heading(darkMode)}`}>
                                {hub.name}
                            </h1>
                            {hub.description && (
                                <p className={`mt-1.5 max-w-2xl text-sm ${ui.muted(darkMode)}`}>{hub.description}</p>
                            )}
                            <button
                                type="button"
                                onClick={() => setEditingHeader(true)}
                                className={`mt-2 text-xs font-semibold ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
                            >
                                Edit league details
                            </button>
                        </>
                    )}
                </div>

                <Link to={`/league/${id}`} className={ui.btn(darkMode)}>
                    View public page
                </Link>
            </div>

            {managerError && <div className={`${ui.alert(darkMode, 'error')} mb-4`} role="alert">{managerError}</div>}

            <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-lg font-bold ${ui.heading(darkMode)}`}>
                    Managers ({hub.managers.length}/{MAX_MANAGERS})
                </h2>
                {hub.managers.length < MAX_MANAGERS && (
                    <button type="button" onClick={() => setModalState('create')} className={ui.btnPrimary()}>
                        Add manager
                    </button>
                )}
            </div>

            {hub.managers.length === 0 ? (
                <div className={`${ui.cardInset(darkMode)} p-8 text-center`}>
                    <p className={`text-sm ${ui.muted(darkMode)}`}>
                        No managers yet. Add up to {MAX_MANAGERS} to build out your league.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {hub.managers.map((manager) => (
                        <div key={manager.id} className={`${ui.card(darkMode)} p-4`}>
                            <div className="flex items-center gap-3">
                                <ManagerAvatar imageData={manager.imageData} name={manager.name} size="h-12 w-12" />
                                <div className="min-w-0 flex-1">
                                    <p className={`truncate font-semibold ${ui.heading(darkMode)}`}>{manager.name}</p>
                                    <p className={`text-xs ${ui.muted(darkMode)}`}>
                                        {manager.roster.length} player{manager.roster.length === 1 ? '' : 's'}
                                    </p>
                                </div>
                            </div>
                            {manager.description && (
                                <p className={`mt-3 line-clamp-2 text-sm ${ui.muted(darkMode)}`}>{manager.description}</p>
                            )}
                            <div className="mt-4 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setModalState(manager)}
                                    className={`${ui.btn(darkMode)} flex-1`}
                                >
                                    Edit
                                </button>
                                {confirmDeleteId === manager.id ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteManager(manager)}
                                            disabled={busyManagerId === manager.id}
                                            className="inline-flex flex-1 items-center justify-center rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-rose-500"
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
                                        onClick={() => setConfirmDeleteId(manager.id)}
                                        className={`${ui.btn(darkMode)} ${darkMode ? 'text-rose-300' : 'text-rose-600'}`}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modalState && (
                <ManagerFormModal
                    darkMode={darkMode}
                    manager={modalState === 'create' ? null : modalState}
                    onClose={() => setModalState(null)}
                    onSave={handleSaveManager}
                />
            )}
        </div>
    );
};

export default LeagueHubManage;
