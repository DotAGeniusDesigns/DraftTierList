import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FormField from './auth/FormField';
import SavedBoardsPanel from './SavedBoardsPanel';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/apiClient';
import { ui } from '../utils/uiTheme';
import {
    USERNAME_MAX,
    validateEmail,
    validatePassword,
    validatePasswordConfirm,
    validateUsername,
} from '../utils/accountRules';

const Section = ({ darkMode, title, description, children, tone = 'default' }) => (
    <section
        className={
            tone === 'danger'
                ? `rounded-2xl border p-5 sm:p-6 ${
                    darkMode ? 'border-rose-500/25 bg-rose-500/[0.04]' : 'border-rose-200 bg-rose-50/50'
                }`
                : `${ui.card(darkMode)} p-5 sm:p-6`
        }
    >
        <div className="mb-5">
            <h2 className={`text-lg font-bold ${tone === 'danger' ? (darkMode ? 'text-rose-200' : 'text-rose-700') : ui.heading(darkMode)}`}>
                {title}
            </h2>
            {description && (
                <p className={`mt-1 text-sm leading-relaxed ${ui.muted(darkMode)}`}>{description}</p>
            )}
        </div>
        {children}
    </section>
);

const ProfilePage = ({ darkMode, players, scoringFormat, onLoadBoard }) => {
    const { user, applyUser, logout, mustChangePassword } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const passwordSectionRef = useRef(null);

    // --- profile details ---
    const [profileForm, setProfileForm] = useState({
        username: user?.username ?? '',
        email: user?.email ?? '',
        currentPassword: '',
    });
    const [profileErrors, setProfileErrors] = useState({});
    const [profileMessage, setProfileMessage] = useState(null);
    const [profileSaving, setProfileSaving] = useState(false);

    // --- password ---
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        newPasswordConfirm: '',
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [passwordMessage, setPasswordMessage] = useState(null);
    const [passwordSaving, setPasswordSaving] = useState(false);

    // --- security / danger zone ---
    const [signOutPassword, setSignOutPassword] = useState('');
    const [signOutState, setSignOutState] = useState({ error: null, message: null, busy: false });
    const [deleteForm, setDeleteForm] = useState({ currentPassword: '', confirm: '' });
    const [deleteErrors, setDeleteErrors] = useState({});
    const [deleteError, setDeleteError] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [signOutError, setSignOutError] = useState(null);

    // Arriving from a temp-password sign-in: jump straight to the form the
    // user is being forced into, rather than leaving them to find it.
    useEffect(() => {
        if (searchParams.get('change-password') !== '1') return;

        passwordSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (searchParams.get('recovered-email') === '1') {
            setPasswordMessage({
                tone: 'warning',
                text: 'Your previous email was restored. Choose a new password to finish securing the account.',
            });
        }
        const next = new URLSearchParams(searchParams);
        next.delete('change-password');
        next.delete('recovered-email');
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);

    // Keep the form in step if the user object changes underneath us.
    useEffect(() => {
        setProfileForm((prev) => ({
            ...prev,
            username: user?.username ?? '',
            email: user?.email ?? '',
        }));
    }, [user?.username, user?.email]);

    if (!user) return null;

    const handleProfileSubmit = async (event) => {
        event.preventDefault();
        if (profileSaving) return;

        const usernameChanged = profileForm.username.trim() !== user.username;
        const emailChanged = profileForm.email.trim().toLowerCase() !== user.email.toLowerCase();

        if (!usernameChanged && !emailChanged) {
            setProfileErrors({});
            setProfileMessage({ tone: 'info', text: 'Nothing to change yet.' });
            return;
        }

        const errors = {
            username: usernameChanged ? validateUsername(profileForm.username) : null,
            email: emailChanged ? validateEmail(profileForm.email) : null,
            currentPassword: profileForm.currentPassword ? null : 'Enter your password to confirm this change.',
        };

        if (Object.values(errors).some(Boolean)) {
            setProfileErrors(errors);
            setProfileMessage(null);
            return;
        }

        setProfileErrors({});
        setProfileMessage(null);
        setProfileSaving(true);

        try {
            // Send only what actually changed, so the server never re-writes a
            // field the user did not touch.
            const payload = { currentPassword: profileForm.currentPassword };
            if (usernameChanged) payload.username = profileForm.username.trim();
            if (emailChanged) payload.email = profileForm.email.trim();

            const data = await api.updateProfile(payload);
            applyUser(data.user);
            setProfileForm((prev) => ({ ...prev, currentPassword: '' }));
            setProfileMessage({
                tone: 'success',
                text: data.message,
            });
        } catch (error) {
            if (error.field) setProfileErrors({ [error.field]: error.message });
            else setProfileMessage({ tone: 'error', text: error.message });
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        if (passwordSaving) return;

        const errors = {
            // A user who got in on a temp password no longer has an old
            // password to type, so the server waives it — and so do we.
            currentPassword: mustChangePassword || passwordForm.currentPassword
                ? null
                : 'Enter your current password.',
            newPassword: validatePassword(passwordForm.newPassword),
            newPasswordConfirm: validatePasswordConfirm(
                passwordForm.newPassword,
                passwordForm.newPasswordConfirm
            ),
        };

        if (Object.values(errors).some(Boolean)) {
            setPasswordErrors(errors);
            setPasswordMessage(null);
            return;
        }

        setPasswordErrors({});
        setPasswordMessage(null);
        setPasswordSaving(true);

        try {
            const data = await api.changePassword(passwordForm);
            applyUser(data.user);
            setPasswordForm({ currentPassword: '', newPassword: '', newPasswordConfirm: '' });
            setPasswordMessage({ tone: 'success', text: data.message });
        } catch (error) {
            if (error.field) setPasswordErrors({ [error.field]: error.message });
            else setPasswordMessage({ tone: 'error', text: error.message });
        } finally {
            setPasswordSaving(false);
        }
    };

    const handleSignOutEverywhere = async (event) => {
        event.preventDefault();
        if (signOutState.busy) return;

        if (!signOutPassword) {
            setSignOutState({ error: 'Enter your password to confirm.', message: null, busy: false });
            return;
        }

        setSignOutState({ error: null, message: null, busy: true });
        try {
            const data = await api.signOutEverywhere(signOutPassword);
            applyUser(data.user);
            setSignOutPassword('');
            setSignOutState({ error: null, message: data.message, busy: false });
        } catch (error) {
            setSignOutState({ error: error.message, message: null, busy: false });
        }
    };

    const handleDelete = async (event) => {
        event.preventDefault();
        if (deleting) return;

        const errors = {
            currentPassword: deleteForm.currentPassword ? null : 'Enter your password to confirm.',
            confirm: deleteForm.confirm.trim().toUpperCase() === 'DELETE' ? null : 'Type DELETE to confirm.',
        };

        if (Object.values(errors).some(Boolean)) {
            setDeleteErrors(errors);
            setDeleteError(null);
            return;
        }

        setDeleteErrors({});
        setDeleteError(null);
        setDeleting(true);

        try {
            await api.deleteAccount(deleteForm.currentPassword, deleteForm.confirm.trim());
            // The account is gone; clear local session state and leave the
            // board in localStorage alone — it is the user's own data.
            await logout();
            navigate('/draft-board', { replace: true });
        } catch (error) {
            if (error.field) setDeleteErrors({ [error.field]: error.message });
            else setDeleteError(error.message);
            setDeleting(false);
        }
    };

    const handleSignOut = async () => {
        setSignOutError(null);
        try {
            await logout();
            navigate('/draft-board', { replace: true });
        } catch {
            setSignOutError('Could not reach the server, so you are still signed in.');
        }
    };

    const memberSince = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString(undefined, {
            year: 'numeric', month: 'long', day: 'numeric',
        })
        : null;

    return (
        <div className="container mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-10">
            <div className="mb-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">
                    Account
                </p>
                <h1 className={`font-display text-2xl font-bold tracking-tight sm:text-3xl ${ui.heading(darkMode)}`}>
                    <span className="text-gradient-brand">Profile &amp; Settings</span>
                </h1>
            </div>

            {mustChangePassword && (
                <div className={`${ui.alert(darkMode, 'warning')} mb-6`} role="alert">
                    <p className="font-semibold">Choose a new password</p>
                    <p className="mt-1">
                        You signed in with a temporary password. Set a permanent one below to secure your account.
                    </p>
                </div>
            )}

            <div className="space-y-5">
                {/* Overview */}
                <div className={`${ui.card(darkMode)} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6`}>
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-xl font-bold text-white shadow-glow">
                            {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className={`truncate text-lg font-bold ${ui.heading(darkMode)}`}>{user.username}</p>
                            <p className={`truncate text-sm ${ui.muted(darkMode)}`}>{user.email}</p>
                            {memberSince && (
                                <p className={`mt-0.5 text-xs ${ui.muted(darkMode)}`}>Member since {memberSince}</p>
                            )}
                        </div>
                    </div>
                    <div className="shrink-0">
                        <button type="button" onClick={handleSignOut} className={ui.btn(darkMode)}>
                            Sign out
                        </button>
                        {signOutError && (
                            <p className="mt-2 max-w-56 text-xs text-rose-500" role="alert">{signOutError}</p>
                        )}
                    </div>
                </div>

                {/* Saved boards */}
                {!mustChangePassword && (
                    <SavedBoardsPanel
                        darkMode={darkMode}
                        players={players}
                        scoringFormat={scoringFormat}
                        onLoadBoard={onLoadBoard}
                    />
                )}

                {/* Profile details */}
                {!mustChangePassword && (
                    <Section
                        darkMode={darkMode}
                        title="Profile details"
                        description="Changing your username or email needs your password, since both identify your account."
                    >
                        <form onSubmit={handleProfileSubmit} className="space-y-4" noValidate>
                        {profileMessage && (
                            <div className={ui.alert(darkMode, profileMessage.tone)} role="status">
                                {profileMessage.text}
                            </div>
                        )}

                        <FormField
                            darkMode={darkMode}
                            label="Username"
                            value={profileForm.username}
                            onChange={(value) => setProfileForm((prev) => ({ ...prev, username: value }))}
                            error={profileErrors.username}
                            autoComplete="username"
                            maxLength={USERNAME_MAX}
                            disabled={profileSaving}
                        />

                        <FormField
                            darkMode={darkMode}
                            label="Email address"
                            type="email"
                            value={profileForm.email}
                            onChange={(value) => setProfileForm((prev) => ({ ...prev, email: value }))}
                            error={profileErrors.email}
                            hint="Password resets go to this address."
                            autoComplete="email"
                            inputMode="email"
                            disabled={profileSaving}
                        />

                        <FormField
                            darkMode={darkMode}
                            label="Current password"
                            type="password"
                            value={profileForm.currentPassword}
                            onChange={(value) => setProfileForm((prev) => ({ ...prev, currentPassword: value }))}
                            error={profileErrors.currentPassword}
                            autoComplete="current-password"
                            disabled={profileSaving}
                            required={false}
                        />

                        <button
                            type="submit"
                            disabled={profileSaving}
                            className={`${ui.btnPrimary()} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            {profileSaving ? 'Saving…' : 'Save changes'}
                        </button>
                        </form>
                    </Section>
                )}

                {/* Password */}
                <div ref={passwordSectionRef}>
                    <Section
                        darkMode={darkMode}
                        title="Password"
                        description="Changing your password signs you out on every other device."
                    >
                        <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
                            {passwordMessage && (
                                <div className={ui.alert(darkMode, passwordMessage.tone)} role="status">
                                    {passwordMessage.text}
                                </div>
                            )}

                            {!mustChangePassword && (
                                <FormField
                                    darkMode={darkMode}
                                    label="Current password"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(value) => setPasswordForm((prev) => ({ ...prev, currentPassword: value }))}
                                    error={passwordErrors.currentPassword}
                                    autoComplete="current-password"
                                    disabled={passwordSaving}
                                    required={false}
                                />
                            )}

                            <FormField
                                darkMode={darkMode}
                                label="New password"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(value) => setPasswordForm((prev) => ({ ...prev, newPassword: value }))}
                                error={passwordErrors.newPassword}
                                hint="At least 8 characters, including a letter and a number."
                                autoComplete="new-password"
                                disabled={passwordSaving}
                                required={false}
                            />

                            <FormField
                                darkMode={darkMode}
                                label="Confirm new password"
                                type="password"
                                value={passwordForm.newPasswordConfirm}
                                onChange={(value) => setPasswordForm((prev) => ({ ...prev, newPasswordConfirm: value }))}
                                error={passwordErrors.newPasswordConfirm}
                                autoComplete="new-password"
                                disabled={passwordSaving}
                                required={false}
                            />

                            <button
                                type="submit"
                                disabled={passwordSaving}
                                className={`${ui.btnPrimary()} disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                                {passwordSaving ? 'Updating…' : 'Update password'}
                            </button>
                        </form>
                    </Section>
                </div>

                {/* Security */}
                {!mustChangePassword && (
                    <>
                    <Section
                    darkMode={darkMode}
                    title="Signed-in devices"
                    description="Signed in somewhere you should not be? This ends every session except this one."
                >
                    <form onSubmit={handleSignOutEverywhere} className="space-y-4" noValidate>
                        {signOutState.message && (
                            <div className={ui.alert(darkMode, 'success')} role="status">{signOutState.message}</div>
                        )}

                        <FormField
                            darkMode={darkMode}
                            label="Current password"
                            type="password"
                            value={signOutPassword}
                            onChange={setSignOutPassword}
                            error={signOutState.error}
                            autoComplete="current-password"
                            disabled={signOutState.busy}
                            required={false}
                        />

                        <button
                            type="submit"
                            disabled={signOutState.busy}
                            className={`${ui.btn(darkMode)} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                            {signOutState.busy ? 'Signing out…' : 'Sign out everywhere else'}
                        </button>
                    </form>
                    </Section>

                    {/* Danger zone */}
                    <Section
                    darkMode={darkMode}
                    tone="danger"
                    title="Delete account"
                    description="Permanently removes your account, your email address and every board saved to it. The board stored in this browser is left alone. This cannot be undone."
                >
                    {!showDeleteConfirm ? (
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="inline-flex items-center justify-center rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/30 dark:bg-transparent dark:text-rose-300 dark:hover:bg-rose-500/10"
                        >
                            Delete my account
                        </button>
                    ) : (
                        <form onSubmit={handleDelete} className="space-y-4" noValidate>
                            {deleteError && (
                                <div className={ui.alert(darkMode, 'error')} role="alert">{deleteError}</div>
                            )}

                            <FormField
                                darkMode={darkMode}
                                label="Current password"
                                type="password"
                                value={deleteForm.currentPassword}
                                onChange={(value) => setDeleteForm((prev) => ({ ...prev, currentPassword: value }))}
                                error={deleteErrors.currentPassword}
                                autoComplete="current-password"
                                disabled={deleting}
                                required={false}
                            />

                            <FormField
                                darkMode={darkMode}
                                label="Type DELETE to confirm"
                                value={deleteForm.confirm}
                                onChange={(value) => setDeleteForm((prev) => ({ ...prev, confirm: value }))}
                                error={deleteErrors.confirm}
                                placeholder="DELETE"
                                disabled={deleting}
                                required={false}
                            />

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={deleting}
                                    className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {deleting ? 'Deleting…' : 'Permanently delete'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setDeleteForm({ currentPassword: '', confirm: '' });
                                        setDeleteErrors({});
                                        setDeleteError(null);
                                    }}
                                    disabled={deleting}
                                    className={ui.btn(darkMode)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                    </Section>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
