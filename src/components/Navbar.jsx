import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import AccountMenu from './AccountMenu';
import { DonateButton, DonatePanel } from './DonateDropdown';
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
        league: (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
        ),
        grader: (
            // A report card: a page with a mark on it.
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
                <path
                    d="M5 2.5h7.5L16 6v11.5H5z"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinejoin="round"
                />
                <path
                    d="M7.5 11.5l2 2 3.5-4.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        ),
        kit: (
            <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
                <path
                    d="M3 15.5l3.5-4.5 3 3L16 5.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d="M12.5 5.5H16v3.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
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

const BurgerIcon = ({ open }) => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        {open ? (
            <path
                fillRule="evenodd"
                d="M4.28 4.28a.75.75 0 011.06 0L10 8.94l4.66-4.66a.75.75 0 111.06 1.06L11.06 10l4.66 4.66a.75.75 0 11-1.06 1.06L10 11.06l-4.66 4.66a.75.75 0 01-1.06-1.06L8.94 10 4.28 5.34a.75.75 0 010-1.06z"
                clipRule="evenodd"
            />
        ) : (
            <path
                fillRule="evenodd"
                d="M2 5.75A.75.75 0 012.75 5h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 5.75zm0 4.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
                clipRule="evenodd"
            />
        )}
    </svg>
);

const Navbar = ({ darkMode, onToggleDarkMode }) => {
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [donateOpen, setDonateOpen] = useState(false);
    const navRef = useRef(null);

    const iconButtonClass = darkMode
        ? 'bg-slate-800/90 text-slate-200 ring-1 ring-white/10 hover:bg-slate-700'
        : 'bg-white text-slate-600 ring-1 ring-slate-200/80 shadow-sm hover:bg-slate-50';

    const themeButtonClass = `flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition sm:h-10 sm:w-10 ${iconButtonClass}`;

    const burgerButtonClass = `flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl transition lg:hidden sm:h-10 sm:w-10 ${
        menuOpen
            ? darkMode
                ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            : iconButtonClass
    }`;

    useEffect(() => {
        setMenuOpen(false);
        setDonateOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!menuOpen && !donateOpen) return undefined;

        const handlePointerDown = (event) => {
            if (navRef.current && !navRef.current.contains(event.target)) {
                setMenuOpen(false);
                setDonateOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setMenuOpen(false);
                setDonateOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [menuOpen, donateOpen]);

    // Small enough not to change the pill's height, so flagging a tab as beta
    // does not reflow the nav.
    const BetaTag = ({ inMenu = false }) => (
        <span
            className={`rounded px-1 py-px text-[9px] font-bold uppercase leading-[1.4] tracking-wide ${
                inMenu ? 'ml-auto' : ''
            } ${darkMode ? 'bg-slate-950/80 text-emerald-400' : 'bg-amber-100 text-amber-700'}`}
        >
            Beta
        </span>
    );

    const renderNavLink = (item, { mobileMenu = false } = {}) => (
        <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
                mobileMenu
                    ? `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        isActive
                            ? darkMode
                                ? 'bg-emerald-500/15 text-emerald-300'
                                : 'bg-emerald-50 text-emerald-700'
                            : darkMode
                                ? 'text-slate-300 hover:bg-white/5 hover:text-white'
                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`
                    : ui.navPill(darkMode, isActive)
            }
            title={item.label}
        >
            <NavIcon name={item.icon} />
            {mobileMenu ? (
                <span>{item.label}</span>
            ) : (
                <>
                    <span className="hidden 2xl:inline">{item.label}</span>
                    <span className="2xl:hidden">{item.shortLabel}</span>
                </>
            )}
            {item.beta && <BetaTag inMenu={mobileMenu} />}
        </NavLink>
    );

    return (
        <nav ref={navRef} className={`${ui.nav(darkMode)} overscroll-x-none`}>
            <div className="container mx-auto max-w-7xl px-3 sm:px-4">
                <div className="flex items-center justify-between gap-2 py-3 sm:gap-3 sm:py-3.5">
                    <Link to="/draft-board" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                        <div className="relative shrink-0">
                            <BrandLogo className="h-9 w-9 sm:h-11 sm:w-11" />
                            <div
                                className={`absolute -inset-1 -z-10 rounded-2xl blur-md ${
                                    darkMode ? 'bg-emerald-500/20' : 'bg-emerald-400/25'
                                }`}
                                aria-hidden="true"
                            />
                        </div>
                        <div className="min-w-0 leading-tight">
                            <p className="truncate font-display text-base font-bold tracking-tight sm:text-xl">
                                <span className="text-gradient-brand">Fantasy</span>
                                <span className={darkMode ? 'text-white' : 'text-slate-900'}> Toolkit</span>
                            </p>
                            <p className={`truncate text-[10px] font-medium uppercase tracking-[0.18em] sm:text-[11px] ${ui.muted(darkMode)}`}>
                                2026 Draft Suite
                            </p>
                        </div>
                    </Link>

                    <div className="hidden lg:flex items-center gap-2">
                        <div className={ui.navSegment(darkMode)}>
                            {NAV_ROUTES.map((item) => renderNavLink(item))}
                        </div>
                        <DonateButton
                            darkMode={darkMode}
                            open={donateOpen}
                            onClick={() => {
                                setDonateOpen((prev) => !prev);
                                setMenuOpen(false);
                            }}
                        />
                        <button
                            type="button"
                            onClick={onToggleDarkMode}
                            className={`${themeButtonClass} ${darkMode ? 'text-amber-300' : ''}`}
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <ThemeIcon darkMode={darkMode} />
                        </button>
                        <AccountMenu darkMode={darkMode} />
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
                        <DonateButton
                            darkMode={darkMode}
                            compact
                            open={donateOpen}
                            onClick={() => {
                                setDonateOpen((prev) => !prev);
                                setMenuOpen(false);
                            }}
                        />
                        <button
                            type="button"
                            onClick={onToggleDarkMode}
                            className={`${themeButtonClass} ${darkMode ? 'text-amber-300' : ''}`}
                            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <ThemeIcon darkMode={darkMode} />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setMenuOpen((prev) => !prev);
                                setDonateOpen(false);
                            }}
                            className={burgerButtonClass}
                            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                            aria-expanded={menuOpen}
                            aria-controls="mobile-nav-menu"
                        >
                            <BurgerIcon open={menuOpen} />
                        </button>
                        <AccountMenu darkMode={darkMode} compact />
                    </div>
                </div>

                {donateOpen && (
                    <DonatePanel darkMode={darkMode} onClose={() => setDonateOpen(false)} />
                )}

                {menuOpen && (
                    <div
                        id="mobile-nav-menu"
                        className={`border-t pb-3 pt-2 lg:hidden ${darkMode ? 'border-white/5' : 'border-slate-200/70'}`}
                    >
                        <div className="flex flex-col gap-1">
                            {NAV_ROUTES.map((item) => renderNavLink(item, { mobileMenu: true }))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
