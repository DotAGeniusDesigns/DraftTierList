import React, { useEffect, useRef, useState } from 'react';
import { PAYPAL_DONATE_URL, PAYPAL_HOSTED_BUTTON_ID } from '../utils/routes';
import { ui } from '../utils/uiTheme';

const SCRIPT_ID = 'paypal-donate-sdk';
const SCRIPT_SRC = 'https://www.paypalobjects.com/donate/sdk/donate-sdk.js';

function loadPayPalDonateSdk() {
    if (window.PayPal && window.PayPal.Donation) {
        return Promise.resolve(window.PayPal);
    }

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
        return new Promise((resolve, reject) => {
            if (window.PayPal && window.PayPal.Donation) {
                resolve(window.PayPal);
                return;
            }
            existing.addEventListener('load', () => resolve(window.PayPal));
            existing.addEventListener('error', reject);
        });
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.charset = 'UTF-8';
        script.async = true;
        script.onload = () => resolve(window.PayPal);
        script.onerror = reject;
        document.body.appendChild(script);
    });
}

const DonateIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
    </svg>
);

const PayPalCheckoutButton = () => (
    <form action="https://www.paypal.com/donate" method="post" target="_blank" rel="noopener noreferrer">
        <input type="hidden" name="hosted_button_id" value={PAYPAL_HOSTED_BUTTON_ID} />
        <button
            type="submit"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#ffc439] px-5 py-2.5 text-sm font-bold text-[#003087] shadow-sm ring-1 ring-[#003087]/10 transition hover:bg-[#f5ba2e] focus:outline-none focus:ring-2 focus:ring-[#0070ba]/40"
        >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                    fill="#003087"
                    d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 2.901a.77.77 0 01.762-.653h6.957c2.303 0 3.903.484 4.903 1.474.775.768 1.19 1.85 1.19 3.21 0 .395-.033.806-.1 1.226-.364 2.29-1.45 3.817-3.123 4.544-.956.418-2.083.63-3.352.63h-1.58a.77.77 0 00-.758.653l-.835 5.293-.12.757a.385.385 0 01-.38.323zm.428-4.365h1.02c2.915 0 4.608-1.392 5.122-4.145.08-.47.12-.928.12-1.366 0-.98-.28-1.736-.835-2.25-.7-.65-1.87-.98-3.48-.98H8.837l-1.333 8.741z"
                />
            </svg>
            Donate with PayPal
        </button>
    </form>
);

const PayPalSdkCheckout = ({ darkMode }) => {
    const containerRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [useFallback, setUseFallback] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let fallbackTimer;

        loadPayPalDonateSdk()
            .then((PayPal) => {
                if (cancelled || !containerRef.current || !PayPal?.Donation?.Button) {
                    setUseFallback(true);
                    return;
                }

                containerRef.current.innerHTML = '';
                PayPal.Donation.Button({
                    env: 'production',
                    hosted_button_id: PAYPAL_HOSTED_BUTTON_ID,
                    image: {
                        src: 'https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif',
                        alt: 'Donate with PayPal button',
                        title: 'PayPal - The safer, easier way to pay online!',
                    },
                }).render(containerRef.current);

                fallbackTimer = window.setTimeout(() => {
                    if (cancelled || !containerRef.current) return;
                    const hasButton = containerRef.current.querySelector('form, img, input, button, a');
                    if (!hasButton) {
                        setUseFallback(true);
                    }
                    setReady(true);
                }, 2000);
            })
            .catch(() => {
                if (!cancelled) setUseFallback(true);
            });

        return () => {
            cancelled = true;
            if (fallbackTimer) window.clearTimeout(fallbackTimer);
        };
    }, []);

    return (
        <div
            className={`rounded-2xl p-5 sm:p-6 ${ui.cardInset(darkMode)} flex flex-col items-center gap-4 text-center`}
        >
            <p className={`max-w-md text-sm leading-relaxed ${ui.muted(darkMode)}`}>
                Checkout opens in PayPal&apos;s secure window — you stay on Fantasy Toolkit the whole time.
            </p>

            {useFallback ? (
                <PayPalCheckoutButton />
            ) : (
                <>
                    <div
                        ref={containerRef}
                        className={`flex min-h-[47px] items-center justify-center ${ready ? '' : 'opacity-60'}`}
                    />
                    {!ready && (
                        <p className={`text-xs ${ui.muted(darkMode)}`}>Loading PayPal checkout…</p>
                    )}
                </>
            )}
        </div>
    );
};

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
        <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
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

        <PayPalSdkCheckout darkMode={darkMode} />

        <p className={`mt-3 text-center text-xs ${ui.muted(darkMode)}`}>
            PayPal handles payment — we never see your card details.{' '}
            <a
                href={PAYPAL_DONATE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#0070ba] underline decoration-[#0070ba]/30 underline-offset-2 hover:decoration-[#0070ba]"
            >
                Open donate page
            </a>
        </p>
    </div>
);
