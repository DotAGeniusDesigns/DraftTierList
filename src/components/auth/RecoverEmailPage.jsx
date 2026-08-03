import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from './AuthShell';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/apiClient';
import { ui } from '../../utils/uiTheme';

const RecoverEmailPage = ({ darkMode }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { applyUser } = useAuth();
    const token = searchParams.get('token') || '';
    const [state, setState] = useState({
        busy: false,
        error: token ? null : 'This recovery link is incomplete.',
    });

    const recover = async () => {
        if (!token || state.busy) return;
        setState({ busy: true, error: null });
        try {
            const data = await api.recoverEmail(token);
            applyUser(data.user);
            navigate('/profile?change-password=1&recovered-email=1', { replace: true });
        } catch (error) {
            setState({ busy: false, error: error.message });
        }
    };

    return (
        <AuthShell
            darkMode={darkMode}
            title="Recover your account"
            subtitle="Restore the previous email address and sign out anyone else."
            footer={(
                <Link to="/login" className="font-semibold text-emerald-500 hover:text-emerald-400">
                    Back to sign in
                </Link>
            )}
        >
            <div className="space-y-4">
                {state.error && <div className={ui.alert(darkMode, 'error')} role="alert">{state.error}</div>}
                <p className={`text-sm leading-relaxed ${ui.muted(darkMode)}`}>
                    After recovery, you will be required to choose a new password before using the account.
                </p>
                <button
                    type="button"
                    onClick={recover}
                    disabled={!token || state.busy}
                    className={`${ui.btnPrimary()} w-full py-2.5 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    {state.busy ? 'Recovering…' : 'Restore email and secure account'}
                </button>
            </div>
        </AuthShell>
    );
};

export default RecoverEmailPage;
