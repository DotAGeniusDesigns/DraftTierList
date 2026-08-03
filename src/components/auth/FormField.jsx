import React, { useId, useState } from 'react';
import { ui } from '../../utils/uiTheme';

// Labelled input with inline error text. Password fields get a show/hide
// toggle, which matters most on the reset flow where people are transcribing
// a temp password out of an email.
const FormField = ({
    darkMode,
    label,
    type = 'text',
    value,
    onChange,
    error,
    hint,
    autoComplete,
    placeholder,
    disabled,
    required = true,
    inputMode,
    maxLength,
    autoFocus,
}) => {
    const id = useId();
    const [revealed, setRevealed] = useState(false);

    const isPassword = type === 'password';
    const resolvedType = isPassword && revealed ? 'text' : type;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
        <div>
            <label htmlFor={id} className={ui.label(darkMode)}>
                {label}
            </label>

            <div className="relative mt-1.5">
                <input
                    id={id}
                    type={resolvedType}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className={`${ui.input(darkMode, Boolean(error))} ${isPassword ? 'pr-16' : ''}`}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    inputMode={inputMode}
                    maxLength={maxLength}
                    autoFocus={autoFocus}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : (hint ? hintId : undefined)}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setRevealed((prev) => !prev)}
                        className={`absolute inset-y-0 right-0 px-3 text-xs font-semibold transition ${
                            darkMode
                                ? 'text-slate-400 hover:text-slate-200'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                        // The label already says which state the click produces.
                        aria-label={revealed ? 'Hide password' : 'Show password'}
                    >
                        {revealed ? 'Hide' : 'Show'}
                    </button>
                )}
            </div>

            {error ? (
                <p id={errorId} className={ui.fieldError(darkMode)}>{error}</p>
            ) : hint ? (
                <p id={hintId} className={`mt-1.5 text-xs ${ui.muted(darkMode)}`}>{hint}</p>
            ) : null}
        </div>
    );
};

export default FormField;
