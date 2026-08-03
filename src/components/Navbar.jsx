import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import AccountMenu from './AccountMenu';
import { ui } from '../utils/uiTheme';
import { NAV_ROUTES } from '../utils/routes';

const NavIcon = ({ name }) => {
    const icons = {
        board: (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path
                    fillRule="evenodd"
                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 5.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                    clipRule="evenodd"
                />
            </svg>
        ),
        range: (
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
                <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="10" cy="10" r="2" fill="currentColor" />
            </svg>
        ),
        offseason: (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path
                    fillRule="evenodd"
                    d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.22z"
                    clipRule="evenodd"
                />
            </svg>
        ),
        lottery: (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path
                    fillRule="evenodd"
                    d="M4 3.5A1.5 1.5 0 015.5 2h9A1.5 1.5 0 0116 3.5v13A1.5 1.5 0 0114.5 18h-9A1.5 1.5 0 014 16.5v-13zM7 6a1 1 0 100-2 1 1 0 000 2zm7 7a1 1 0 11-2 0 1 1 0 012 0zm-4-3.5a1 1 0 100-2 1 1 0 000 2zM7 16a1 1 0 100-2 1 1 0 000 2zm7-10a1 1 0 11-2 0 1 1 0 012 0z"
                    clipRule="evenodd"
                />
            </svg>
        ),
        streams: (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z" />
            </svg>
        ),
        watch: (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path
                    fillRule="evenodd"
                    d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                    clipRule="evenodd"
                />
            </svg>
        ),
    };
    return icons[name] || null;
};

const ThemeIcon = ({ darkMode }) =>
    darkMode ? (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
        </svg>
    ) : (
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
    );

const Navbar = ({ darkMode, onToggleDarkMode }) => {
    const themeButtonClass = `flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition sm:h-10 sm:w-10 ${
        darkMode
            ? 'bg-slate-800/90 text-amber-300 ring-1 ring-white/10 hover:bg-slate-700'
            : 'bg-white text-slate-600 ring-1 ring-slate-200/80 shadow-sm hover:bg-slate-50'
    }`;

    const renderNavLink = (item, compact = false) => (
        <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
                `${ui.navPill(darkMode, isActive)} ${compact ? 'w-full flex-col gap-1 px-1 py-2.5' : ''}`
            }
            title={item.label}
        >
            <NavIcon name={item.icon} />
            {compact ? (
                <span className="text-[10px] font-semibold leading-none">{item.shortLabel}</span>
            ) : (
                <>
                    <span className="hidden xl:inline">{item.label}</span>
                    <span className="xl:hidden">{item.shortLabel}</span>
                </>
            )}
        </NavLink>
    );

    return (
        <nav className={`${ui.nav(darkMode)} overscroll-x-none`}>
            <div className="container mx-auto max-w-7xl px-3 sm:px-4">
                <div className="flex items-center justify-between gap-3 py-3 sm:py-3.5">
                    <Link to="/draft-board" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <div className="relative shrink-0">
                            <BrandLogo className="h-9 w-9 sm:h-11 sm:w-11" darkMode={darkMode} />
                            <div
                                className={`absolute -inset-1 -z-10 rounded-2xl blur-md ${
                                    darkMode ? 'bg-emerald-500/20' : 'bg-emerald-400/25'
                                }`}
                                aria-hidden="true"
                            />
                        </div>
                        <div className="min-w-0 leading-tight">
                            <p className="font-display text-base font-bold tracking-tight sm:text-xl">
                                <span className="text-gradient-brand">Fantasy</span>
                                <span className={darkMode ? 'text-white' : 'text-slate-900'}> Toolkit</span>
                            </p>
                            <p className={`text-[10px] font-medium uppercase tracking-[0.18em] sm:text-[11px] ${ui.muted(darkMode)}`}>
                                2026 Draft Suite
                            </p>
                        </div>
                    </Link>

                    <div className="hidden lg:flex items-center gap-2">
                        <div className={ui.navSegment(darkMode)}>
                            {NAV_ROUTES.map((item) => renderNavLink(item))}
                        </div>
                        <button
                            type="button"
                            onClick={onToggleDarkMode}
                            className={themeButtonClass}
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <ThemeIcon darkMode={darkMode} />
                        </button>
                        <AccountMenu darkMode={darkMode} />
                    </div>

                    <div className="flex items-center gap-2 lg:hidden">
                        <button
                            type="button"
                            onClick={onToggleDarkMode}
                            className={themeButtonClass}
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <ThemeIcon darkMode={darkMode} />
                        </button>
                        <AccountMenu darkMode={darkMode} compact />
                    </div>
                </div>

                <div className={`lg:hidden border-t pb-3 pt-2.5 ${darkMode ? 'border-white/5' : 'border-slate-200/70'}`}>
                    <div
                        className="grid gap-1"
                        style={{ gridTemplateColumns: `repeat(${NAV_ROUTES.length}, minmax(0, 1fr))` }}
                    >
                        {NAV_ROUTES.map((item) => renderNavLink(item, true))}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
