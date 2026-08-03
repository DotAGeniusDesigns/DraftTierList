import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ui } from '../../utils/uiTheme';

// Route guard for account-only pages. Remembers where the visitor was trying
// to go so LoginPage can send them back there afterwards.
const RequireAuth = ({ darkMode, children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Redirecting before the session check resolves would bounce signed-in
    // users to /login on every hard refresh.
    if (isLoading) {
        return (
            <div className="container mx-auto max-w-md px-4 py-20 text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <p className={`mt-4 text-sm ${ui.muted(darkMode)}`}>Checking your session…</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    }

    return children;
};

export default RequireAuth;
