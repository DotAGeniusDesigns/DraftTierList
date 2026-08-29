import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import FormField from './FormField';
import { useAuth } from '../../context/AuthContext';
import { ui } from '../../utils/uiTheme';

const LoginPage = ({ darkMode }) => {
    const { login, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Where the user was headed before the route guard bounced them here.
    const redirectTo = location.state?.from || '/draft-board';

    if (!isLoading && isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        setFieldErrors({});
        setFormError(null);
        setSubmitting(true);

        try {
            const user = await login(identifier.trim(), password);
            // Someone who just used a temp password has to pick a real one
            // before they get anywhere else.
            navigate(user.mustChangePassword ? '/profile?change-password=1' : redirectTo, { replace: true });
        } catch (error) {
            if (error.field) {
                setFieldErrors({ [error.field]: error.message });
            } else {
                setFormError(error.message);
            }
            setSubmitting(false);
        }
    };

    return (
        <AuthShell
            darkMode={darkMode}
            title="Welcome back"
            subtitle="Sign in to sync your draft boards across devices."
            footer={(
                <>
                    New here?{' '}
                    <Link to="/signup" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-400">
                        Create an account
                    </Link>
                </>
            )}
        >
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {formError && (
                    <div className={ui.alert(darkMode, 'error')} role="alert">{formError}</div>
                )}

                <FormField
                    darkMode={darkMode}
                    label="Username or email"
                    value={identifier}
                    onChange={setIdentifier}
                    error={fieldErrors.identifier}
                    autoComplete="username"
                    placeholder="you@example.com"
                    disabled={submitting}
                    autoFocus
                />

                <FormField
                    darkMode={darkMode}
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    error={fieldErrors.password}
                    autoComplete="current-password"
                    disabled={submitting}
                />

                <div className="flex justify-end">
                    <Link
                        to="/forgot-password"
                        className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-400"
                    >
                        Forgot your password?
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className={`${ui.btnPrimary()} w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    {submitting ? 'Signing in…' : 'Sign in'}
                </button>
            </form>
        </AuthShell>
    );
};

export default LoginPage;
