import React from 'react';
import { PAYPAL_DONATE_URL } from '../utils/routes';
import { ui } from '../utils/uiTheme';

const DonateIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
    </svg>
);

export const DonateButton = ({ darkMode, compact = false, open = false, onClick, className = '' }) => (
    <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        aria-controls="donate-panel"
        title="Support Fantasy Toolkit"
        className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${
            open
                ? darkMode
                    ? 'bg-[#0070ba]/30 text-[#9ed4ff] ring-1 ring-[#0070ba]/50'
                    : 'bg-[#0070ba]/20 text-[#003087] ring-1 ring-[#0070ba]/40'
                : darkMode
                    ? 'bg-[#0070ba]/20 text-[#6ec3ff] ring-1 ring-[#0070ba]/35 hover:bg-[#0070ba]/30'
                    : 'bg-[#0070ba]/10 text-[#003087] ring-1 ring-[#0070ba]/25 hover:bg-[#0070ba]/15'
        } ${className}`}
    >
        <DonateIcon />
        {!compact && <span className="hidden sm:inline">Donate</span>}
        {compact && <span className="sr-only">Donate</span>}
    </button>
);

export const DonatePanel = ({ darkMode, onClose }) => (
        <div
            id="donate-panel"
            className={`border-t pb-4 pt-3 ${darkMode ? 'border-white/5' : 'border-slate-200/70'}`}
        >
            <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-500">
                        Support the project
                    </p>
                    <h2 className={`mt-1 text-base font-bold sm:text-lg ${ui.heading(darkMode)}`}>
                        Help keep Fantasy Toolkit free
                    </h2>
                    <p className={`mt-1 max-w-2xl text-sm leading-relaxed ${ui.muted(darkMode)}`}>
                        Draft boards, offseason intel, and sync tools take time to build and host.
                        Tips go straight to keeping the site running and updated.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                        darkMode
                            ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                    aria-label="Close donation panel"
                >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                        <path
                            fillRule="evenodd"
                            d="M4.28 4.28a.75.75 0 011.06 0L10 8.94l4.66-4.66a.75.75 0 111.06 1.06L11.06 10l4.66 4.66a.75.75 0 11-1.06 1.06L10 11.06l-4.66 4.66a.75.75 0 01-1.06-1.06L8.94 10 4.28 5.34a.75.75 0 010-1.06z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>

            <div
                className={`overflow-hidden rounded-2xl ring-1 ${
                    darkMode ? 'bg-white ring-white/10' : 'bg-white ring-slate-200'
                }`}
            >
                <iframe
                    src={PAYPAL_DONATE_URL}
                    title="PayPal donation checkout"
                    className="block w-full bg-white"
                    style={{ height: 'min(520px, 58vh)' }}
                />
            </div>

            <p className={`mt-2.5 text-xs ${ui.muted(darkMode)}`}>
                Secure checkout via PayPal.{' '}
                <a
                    href={PAYPAL_DONATE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#0070ba] underline decoration-[#0070ba]/30 underline-offset-2 hover:decoration-[#0070ba]"
                >
                    Open on PayPal
                </a>
                {' '}if the form does not load below.
            </p>
        </div>
);
