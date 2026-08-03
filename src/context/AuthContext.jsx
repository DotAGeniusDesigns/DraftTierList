import React, {
    createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { api } from '../utils/apiClient';

// Signed-in state for the whole app.
//
// Accounts are optional here: the draft board works fully logged out, so a
// failed /me call is not an error state — it just means `user` stays null and
// everything account-flavoured hides itself.

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Distinct from "no user": until the first /me resolves we don't know yet,
    // and rendering a "Sign in" button in that gap makes the navbar flicker
    // for anyone who is already signed in.
    const [isLoading, setIsLoading] = useState(true);
    // Set when the API itself is unreachable (offline, or no backend running
    // in a plain `npm start`), so the UI can say so instead of insisting
    // nobody is logged in.
    const [isOffline, setIsOffline] = useState(false);
    // A login/signup/logout that starts while the bootstrap /me request is in
    // flight invalidates that older response, preventing stale auth overwrite.
    const authVersionRef = useRef(0);

    useEffect(() => {
        const controller = new AbortController();
        const requestVersion = authVersionRef.current;

        api.me(controller.signal)
            .then((data) => {
                if (requestVersion !== authVersionRef.current) return;
                setUser(data.user);
                setIsOffline(false);
            })
            .catch((error) => {
                if (error.name === 'AbortError') return;
                if (requestVersion !== authVersionRef.current) return;
                setUser(null);
                // A 401 is a normal logged-out answer. Anything else means the
                // API is not there: 0 for an unreachable host, 404 when the SPA
                // fallback answers instead of a function (a plain `npm start`
                // with no `vercel dev`), 5xx for a broken deploy.
                setIsOffline(error.status === 0 || error.status === 404 || error.status >= 500);
            })
            .finally(() => {
                if (!controller.signal.aborted) setIsLoading(false);
            });

        return () => controller.abort();
    }, []);

    useEffect(() => {
        if (!isOffline) return undefined;

        let controller = null;
        const retry = () => {
            controller?.abort();
            controller = new AbortController();
            const requestVersion = authVersionRef.current;
            api.me(controller.signal)
                .then((data) => {
                    if (requestVersion !== authVersionRef.current) return;
                    setUser(data.user);
                    setIsOffline(false);
                })
                .catch(() => {
                    // Stay offline; the next online event or timer will retry.
                });
        };

        window.addEventListener('online', retry);
        const timer = window.setInterval(retry, 30_000);
        return () => {
            window.removeEventListener('online', retry);
            window.clearInterval(timer);
            controller?.abort();
        };
    }, [isOffline]);

    const login = useCallback(async (identifier, password) => {
        authVersionRef.current += 1;
        const data = await api.login(identifier, password);
        setUser(data.user);
        setIsOffline(false);
        return data.user;
    }, []);

    const signup = useCallback(async (payload) => {
        authVersionRef.current += 1;
        const data = await api.signup(payload);
        setUser(data.user);
        setIsOffline(false);
        return data.user;
    }, []);

    const logout = useCallback(async () => {
        authVersionRef.current += 1;
        await api.logout();
        // Only claim success after the server has actually expired the
        // httpOnly cookie. A network failure leaves the signed-in state intact.
        setUser(null);
    }, []);

    // Endpoints that mutate the account return the updated user; this keeps
    // the context in step without a refetch.
    const applyUser = useCallback((nextUser) => {
        authVersionRef.current += 1;
        setUser(nextUser);
    }, []);

    const value = useMemo(() => ({
        user,
        isLoading,
        isOffline,
        isAuthenticated: Boolean(user),
        // Set after signing in with a temp password: the app funnels the user
        // to the password form until it clears.
        mustChangePassword: Boolean(user?.mustChangePassword),
        login,
        signup,
        logout,
        applyUser,
    }), [user, isLoading, isOffline, login, signup, logout, applyUser]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside an <AuthProvider>.');
    return context;
};
