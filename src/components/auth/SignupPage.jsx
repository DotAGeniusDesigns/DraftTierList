import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import FormField from './FormField';
import { useAuth } from '../../context/AuthContext';
import { ui } from '../../utils/uiTheme';
import {
    PASSWORD_MIN,
    USERNAME_MAX,
    USERNAME_MIN,
    passwordStrength,
    validateEmail,
    validatePassword,
    validatePasswordConfirm,
    validateUsername,
} from '../../utils/accountRules';

const STRENGTH_BARS = [0, 1, 2, 3];

const StrengthMeter = ({ darkMode, password }) => {
    const { score, label } = useMemo(() => passwordStrength(password), [password]);
    if (!password) return null;

    const tone = score <= 1 ? 'bg-rose-500' : score === 2 ? 'bg-amber-500' : 'bg-green-500';

    return (
        <div className="mt-2">
            <div className="flex gap-1.5">
                {STRENGTH_BARS.map((index) => (
                    <span
                        key={index}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                            index < score ? tone : darkMode ? 'bg-slate-700' : 'bg-slate-200'
                        }`}
                    />
                ))}
            </div>
            <p className={`mt-1.5 text-xs ${ui.muted(darkMode)}`}>Password strength: {label}</p>
        </div>
    );
};

const SignupPage = ({ darkMode }) => {
    const { signup, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        passwordConfirm: '',
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    if (!isLoading && isAuthenticated) {
        return <Navigate to="/draft-board" replace />;
    }

    const setField = (key) => (value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        // Clear a field's error as soon as it is edited; re-validation happens
        // on submit.
        setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        // Client-side pass first so obvious mistakes never cost a round trip.
        // The server re-checks all of this regardless.
        const errors = {
            username: validateUsername(form.username),
            email: validateEmail(form.email),
            password: validatePassword(form.password),
            passwordConfirm: validatePasswordConfirm(form.password, form.passwordConfirm),
            acceptedTerms: acceptedTerms ? null : 'Accept the Terms and Privacy Policy to continue.',
        };

        const firstError = Object.values(errors).find(Boolean);
        if (firstError) {
            setFieldErrors(errors);
            setFormError(null);
            return;
        }

        setFieldErrors({});
        setFormError(null);
        setSubmitting(true);

        try {
            await signup({
                username: form.username.trim(),
                email: form.email.trim(),
                password: form.password,
                passwordConfirm: form.passwordConfirm,
                acceptedTerms: true,
            });
            navigate('/draft-board', { replace: true });
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
            title="Create your account"
            subtitle="Save your draft boards and pick up where you left off on any device."
            showLegal
            footer={(
                <>
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-400">
                        Sign in
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
                    label="Username"
                    value={form.username}
                    onChange={setField('username')}
                    error={fieldErrors.username}
                    hint={`${USERNAME_MIN}–${USERNAME_MAX} characters. Letters, numbers, underscores and hyphens.`}
                    autoComplete="username"
                    placeholder="draftday_dan"
                    maxLength={USERNAME_MAX}
                    disabled={submitting}
                    autoFocus
                />

                <FormField
                    darkMode={darkMode}
                    label="Email address"
                    type="email"
                    value={form.email}
                    onChange={setField('email')}
                    error={fieldErrors.email}
                    hint="Used for password resets. We do not send marketing email."
                    autoComplete="email"
                    placeholder="you@example.com"
                    inputMode="email"
                    disabled={submitting}
                />

                <div>
                    <FormField
                        darkMode={darkMode}
                        label="Password"
                        type="password"
                        value={form.password}
                        onChange={setField('password')}
                        error={fieldErrors.password}
                        hint={`At least ${PASSWORD_MIN} characters, including a letter and a number.`}
                        autoComplete="new-password"
                        disabled={submitting}
                    />
                    <StrengthMeter darkMode={darkMode} password={form.password} />
                </div>

                <FormField
                    darkMode={darkMode}
                    label="Confirm password"
                    type="password"
                    value={form.passwordConfirm}
                    onChange={setField('passwordConfirm')}
                    error={fieldErrors.passwordConfirm}
                    autoComplete="new-password"
                    disabled={submitting}
                />

                <div>
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(event) => {
                                setAcceptedTerms(event.target.checked);
                                setFieldErrors((prev) => ({ ...prev, acceptedTerms: undefined }));
                            }}
                            disabled={submitting}
                            aria-invalid={Boolean(fieldErrors.acceptedTerms)}
                            aria-describedby={fieldErrors.acceptedTerms ? 'accepted-terms-error' : undefined}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500/30"
                        />
                        <span className={`text-sm leading-relaxed ${ui.muted(darkMode)}`}>
                            I agree to the{' '}
                            <Link to="/terms" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-400">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link to="/privacy" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-400">
                                Privacy Policy
                            </Link>
                            .
                        </span>
                    </label>
                    {fieldErrors.acceptedTerms && (
                        <p id="accepted-terms-error" className={ui.fieldError(darkMode)}>
                            {fieldErrors.acceptedTerms}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className={`${ui.btnPrimary()} w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    {submitting ? 'Creating account…' : 'Create account'}
                </button>
            </form>
        </AuthShell>
    );
};

export default SignupPage;
