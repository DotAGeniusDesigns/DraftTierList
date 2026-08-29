import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from './AuthShell';
import FormField from './FormField';
import { api } from '../../utils/apiClient';
import { ui } from '../../utils/uiTheme';
import { validateEmail } from '../../utils/accountRules';

const ForgotPasswordPage = ({ darkMode }) => {
    const [email, setEmail] = useState('');
    const [fieldError, setFieldError] = useState(null);
    const [formError, setFormError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (submitting) return;

        const emailError = validateEmail(email);
        if (emailError) {
            setFieldError(emailError);
            return;
        }

        setFieldError(null);
        setFormError(null);
        setSubmitting(true);

        try {
            await api.forgotPassword(email.trim());
            setSent(true);
        } catch (error) {
            if (error.field) setFieldError(error.message);
            else setFormError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // The confirmation is deliberately vague about whether the address is
    // registered — the server answers the same either way, and saying more
    // here would undo that.
    if (sent) {
        return (
            <AuthShell
                darkMode={darkMode}
                title="Check your email"
                subtitle="If an account uses that address, a temporary password is on its way."
            >
                <div className="space-y-4">
                    <div className={ui.alert(darkMode, 'info')}>
                        <p className="font-semibold">What happens next</p>
                        <ul className="mt-2 list-disc space-y-1 pl-4">
                            <li>The temporary password works for 60 minutes.</li>
                            <li>Your existing password still works, if you remember it.</li>
                            <li>You will be asked to set a new password once you sign in with the temporary one.</li>
                        </ul>
                    </div>

                    <p className={`text-sm ${ui.muted(darkMode)}`}>
                        Nothing arrived after a few minutes? Check your spam folder, then try again.
                    </p>

                    <Link to="/login" className={`${ui.btnPrimary()} w-full py-2.5`}>
                        Back to sign in
                    </Link>

                    <button
                        type="button"
                        onClick={() => setSent(false)}
                        className={`${ui.btn(darkMode)} w-full py-2.5`}
                    >
                        Use a different email
                    </button>
                </div>
            </AuthShell>
        );
    }

    return (
        <AuthShell
            darkMode={darkMode}
            title="Reset your password"
            subtitle="Enter the email on your account and we will send a temporary password."
            footer={(
                <>
                    Remembered it?{' '}
                    <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-400">
                        Back to sign in
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
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(value) => {
                        setEmail(value);
                        setFieldError(null);
                    }}
                    error={fieldError}
                    autoComplete="email"
                    placeholder="you@example.com"
                    inputMode="email"
                    disabled={submitting}
                    autoFocus
                />

                <button
                    type="submit"
                    disabled={submitting}
                    className={`${ui.btnPrimary()} w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    {submitting ? 'Sending…' : 'Send temporary password'}
                </button>
            </form>
        </AuthShell>
    );
};

export default ForgotPasswordPage;
