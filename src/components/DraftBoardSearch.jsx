import React, { useEffect, useMemo, useRef, useState } from 'react';
import { findPlayers } from '../utils/playerSearch';
import { ui } from '../utils/uiTheme';

const DraftBoardSearch = ({ players, darkMode, onSelectPlayer }) => {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const matches = useMemo(() => findPlayers(query, players), [query, players]);

    useEffect(() => {
        setActiveIndex(0);
    }, [matches]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectPlayer = (player) => {
        if (!player) return;
        onSelectPlayer(player);
        setQuery('');
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)));
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            if (matches[activeIndex]) {
                selectPlayer(matches[activeIndex]);
            }
            return;
        }

        if (event.key === 'Escape') {
            setIsOpen(false);
            setQuery('');
        }
    };

    const inputClass = darkMode
        ? 'border-white/10 bg-slate-900/80 text-white placeholder:text-slate-500 focus:border-emerald-500/40 focus:ring-emerald-500/30'
        : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-emerald-500/20';

    return (
        <div ref={containerRef} className="relative w-full sm:max-w-xs">
            <div className="relative">
                <svg
                    className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${ui.muted(darkMode)}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search players..."
                    aria-label="Search players on draft board"
                    aria-expanded={isOpen && matches.length > 0}
                    aria-controls="draft-board-search-results"
                    className={`w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 ${inputClass}`}
                />
                {query && (
                    <button
                        type="button"
                        onClick={() => {
                            setQuery('');
                            setIsOpen(false);
                            inputRef.current?.focus();
                        }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 transition ${darkMode ? 'text-slate-500 hover:bg-white/5 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                        aria-label="Clear search"
                    >
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>

            {isOpen && query.trim() && (
                <div
                    id="draft-board-search-results"
                    role="listbox"
                    className={`absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl p-1.5 ${ui.dropdown(darkMode)}`}
                >
                    {matches.length === 0 ? (
                        <p className={`px-3 py-2.5 text-sm ${ui.muted(darkMode)}`}>No players found</p>
                    ) : (
                        matches.map((player, index) => (
                            <button
                                key={player.id}
                                type="button"
                                role="option"
                                aria-selected={index === activeIndex}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => selectPlayer(player)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                                    index === activeIndex
                                        ? darkMode
                                            ? 'bg-emerald-500/15 text-white'
                                            : 'bg-emerald-50 text-slate-900'
                                        : darkMode
                                            ? 'text-slate-200 hover:bg-white/5'
                                            : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <span className={`shrink-0 text-xs font-bold ${ui.muted(darkMode)}`}>T{player.tier}</span>
                                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{player.name}</span>
                                <span className={`shrink-0 text-xs font-semibold ${ui.muted(darkMode)}`}>
                                    {player.position} · {player.team}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default DraftBoardSearch;
