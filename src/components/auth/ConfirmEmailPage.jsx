import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthShell from './AuthShell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/apiClient';
import { ui } from '../../utils/uiTheme';

const ConfirmEmailPage = ({ darkMode }) => {
    const [searchParams] = useSearchParams();
    const { applyUser } = useAuth();
    const token = searchParams.get('token') || '';
    const [state, setState] = useState({
        busy: false,
        error: token ? null : 'This confirmation link is incomplete.',
        message: null,
    });

    const confirm = async () => {
        if (!token || state.busy || state.message) return;
        setState({ busy: true, error: null, message: null });
        try {
            const data = await api.confirmEmail(token);
            applyUser(data.user);
            setState({ busy: false, error: null, message: data.message });
        } catch (error) {
            setState({ busy: false, error: error.message, message: null });
        }
    };

    return (
        <AuthShell
            darkMode={darkMode}
            title="Confirm email"
            subtitle="Finish changing the email address on your account."
            footer={(
                <Link to="/profile" className="font-semibold text-emerald-500 hover:text-emerald-400">
                    Back to profile
                </Link>
            )}
        >
            <div className="space-y-4">
                {state.error && <div className={ui.alert(darkMode, 'error')} role="alert">{state.error}</div>}
                {state.message && <div className={ui.alert(darkMode, 'success')} role="status">{state.message}</div>}
                {!state.message && (
                    <button
                        type="button"
                        onClick={confirm}
                        disabled={!token || state.busy}
                        className={`${ui.btnPrimary()} w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                        {state.busy ? 'Confirming…' : 'Confirm email address'}
                    </button>
                )}
            </div>
        </AuthShell>
    );
};

export default ConfirmEmailPage;
