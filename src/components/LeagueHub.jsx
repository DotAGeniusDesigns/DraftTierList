import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../utils/apiClient';
import { ui } from '../utils/uiTheme';
import { getPositionTagProps } from '../utils/playerStyles';
import { usePositionColors } from '../context/PositionColorsContext';
import { playerDatabase } from '../utils/playerDatabase';

const ManagerAvatar = ({ imageData, name, size = 'h-16 w-16' }) => (
    <div className={`${size} shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800`}>
        {imageData ? (
            <img src={imageData} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-500">
                {(name || '?').slice(0, 2).toUpperCase()}
            </div>
        )}
    </div>
);

const RosterGrid = ({ roster, darkMode }) => {
    const { colors: positionColors } = usePositionColors();
    const players = roster.map((playerId) => playerDatabase[playerId]).filter(Boolean);

    if (players.length === 0) {
        return <p className={`mt-3 text-sm ${ui.muted(darkMode)}`}>No roster entered yet.</p>;
    }

    return (
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {players.map((player) => (
                <li key={player.id} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 ${ui.cardInset(darkMode)}`}>
                    <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <img src={player.photo} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                    <span {...getPositionTagProps(player.position, { darkMode, colors: positionColors })}>
                        {player.position}
                    </span>
                    <span className={`min-w-0 flex-1 truncate text-sm ${ui.heading(darkMode)}`}>{player.name}</span>
                </li>
            ))}
        </ul>
    );
};

const ManagerCard = ({ manager, darkMode }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={`${ui.card(darkMode)} p-5`}>
            <div className="flex items-center gap-3.5">
                <ManagerAvatar imageData={manager.imageData} name={manager.name} />
                <div className="min-w-0 flex-1">
                    <p className={`truncate text-lg font-bold ${ui.heading(darkMode)}`}>{manager.name}</p>
                    <p className={`text-xs ${ui.muted(darkMode)}`}>
                        {manager.roster.length} player{manager.roster.length === 1 ? '' : 's'}
                    </p>
                </div>
            </div>

            {manager.description && (
                <p className={`mt-3 text-sm leading-relaxed ${ui.muted(darkMode)}`}>{manager.description}</p>
            )}

            <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className={`mt-3 text-xs font-semibold ${darkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}
            >
                {expanded ? 'Hide roster' : 'Show roster'}
            </button>

            {expanded && <RosterGrid roster={manager.roster} darkMode={darkMode} />}
        </div>
    );
};

const LeagueHub = ({ darkMode }) => {
    const { id } = useParams();

    const [hub, setHub] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const controller = new AbortController();
        api.getLeagueHub(id, controller.signal)
            .then((data) => setHub(data.hub))
            .catch((err) => {
                if (err.name !== 'AbortError') setError(err.message);
            });
        return () => controller.abort();
    }, [id]);

    if (error) {
        return (
            <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
                <div className={`${ui.card(darkMode)} p-8`}>
                    <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-rose-500">
                        Link not found
                    </p>
                    <h1 className={`font-display text-2xl font-bold ${ui.heading(darkMode)}`}>
                        This league hub doesn&apos;t exist
                    </h1>
                    <p className={`mx-auto mt-3 max-w-md text-sm ${ui.muted(darkMode)}`}>{error}</p>
                    <Link to="/league-hub" className={`${ui.btnPrimary()} mt-6 inline-flex`}>
                        Create a league hub
                    </Link>
                </div>
            </div>
        );
    }

    if (!hub) {
        return (
            <div className="container mx-auto max-w-6xl px-4 py-16 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <p className={`mt-4 text-sm ${ui.muted(darkMode)}`} role="status">Loading league…</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
            <div className="mb-6">
                <h1 className={`font-display text-2xl font-bold tracking-tight sm:text-3xl ${ui.heading(darkMode)}`}>
                    {hub.name}
                </h1>
                {hub.description && (
                    <p className={`mt-1.5 max-w-2xl text-sm sm:text-base ${ui.muted(darkMode)}`}>{hub.description}</p>
                )}
                <p className={`mt-1 text-xs ${ui.muted(darkMode)}`}>
                    {hub.managers.length} manager{hub.managers.length === 1 ? '' : 's'}
                </p>
            </div>

            {hub.managers.length === 0 ? (
                <div className={`${ui.cardInset(darkMode)} p-8 text-center`}>
                    <p className={`text-sm ${ui.muted(darkMode)}`}>No managers have been added to this league yet.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {hub.managers.map((manager) => (
                        <ManagerCard key={manager.id} manager={manager} darkMode={darkMode} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeagueHub;
