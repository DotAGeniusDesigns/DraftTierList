import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ui } from '../utils/uiTheme';

// Navbar account control: a "Sign in" link when logged out, an avatar dropdown
// when logged in.
const AccountMenu = ({ darkMode, compact = false }) => {
    const { user, isAuthenticated, isLoading, isOffline, logout, mustChangePassword } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [logoutState, setLogoutState] = useState({ busy: false, error: null });
    const containerRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        const handlePointerDown = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    const handleSignOut = async () => {
        if (logoutState.busy) return;
        setLogoutState({ busy: true, error: null });
        try {
            await logout();
            setOpen(false);
            navigate('/draft-board');
        } catch {
            setLogoutState({
                busy: false,
                error: 'Could not sign out because the server is unreachable. You are still signed in.',
            });
        }
    };

    // Hold the space rather than showing a "Sign in" button that would swap to
    // an avatar a moment later. Also stay hidden when no API is answering, so
    // a backend-less dev server doesn't advertise a broken sign-in.
    if (isLoading || isOffline) {
        return <div className={compact ? 'h-9 w-9' : 'h-9 w-9 sm:h-10 sm:w-10'} aria-hidden="true" />;
    }

    if (!isAuthenticated) {
        return (
            <Link
                to="/login"
                className={compact ? `${ui.btn(darkMode)} shrink-0 whitespace-nowrap px-3 py-1.5 text-xs` : `${ui.btn(darkMode)} shrink-0 whitespace-nowrap`}
            >
                Sign in
            </Link>
        );
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => {
                    setLogoutState((prev) => ({ ...prev, error: null }));
                    setOpen((prev) => !prev);
                }}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-slate-950 shadow-glow transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 sm:h-10 sm:w-10"
                aria-haspopup="true"
                aria-expanded={open}
                aria-label={`Account menu for ${user.username}`}
            >
                {user.username.slice(0, 2).toUpperCase()}
                {mustChangePassword && (
                    <span
                        className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-amber-400 dark:border-slate-950"
                        title="Action needed: set a new password"
                    />
                )}
            </button>

            {open && (
                <div className={`absolute right-0 top-full z-30 mt-2 w-56 p-2 ${ui.dropdown(darkMode)}`}>
                    <div className={`border-b px-3 py-2.5 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                        <p className={`truncate text-sm font-semibold ${ui.heading(darkMode)}`}>
                            {user.username}
                        </p>
                        <p className={`truncate text-xs ${ui.muted(darkMode)}`}>{user.email}</p>
                    </div>

                    {mustChangePassword && (
                        <Link
                            to="/profile?change-password=1"
                            onClick={() => setOpen(false)}
                            className={`mt-1 block rounded-lg px-3 py-2 text-sm font-semibold ${
                                darkMode
                                    ? 'text-amber-300 hover:bg-white/5'
                                    : 'text-amber-700 hover:bg-amber-50'
                            }`}
                        >
                            Set a new password
                        </Link>
                    )}

                    <Link
                        to="/profile"
                        onClick={() => setOpen(false)}
                        className={`mt-1 block rounded-lg px-3 py-2 text-sm font-medium transition ${
                            darkMode ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        Profile &amp; settings
                    </Link>

                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={logoutState.busy}
                        className={`mt-0.5 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                            darkMode ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                        {logoutState.busy ? 'Signing out…' : 'Sign out'}
                    </button>
                    {logoutState.error && (
                        <p className={`px-3 pb-1 pt-2 text-xs ${darkMode ? 'text-rose-300' : 'text-rose-600'}`} role="alert">
                            {logoutState.error}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AccountMenu;
