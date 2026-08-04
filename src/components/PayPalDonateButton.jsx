import React from 'react';
import { PAYPAL_DONATE_URL } from '../utils/routes';

const POPUP = 'width=450,height=650,scrollbars=yes,resizable=yes';

const openDonatePopup = () => {
    const width = 450;
    const height = 650;
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
    const popup = window.open(
        PAYPAL_DONATE_URL,
        'paypal_donate',
        `${POPUP},left=${left},top=${top}`,
    );
    popup?.focus();
};

const DonateIcon = () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
    </svg>
);

const PayPalDonateButton = ({ darkMode, compact = false, className = '' }) => (
    <button
        type="button"
        onClick={openDonatePopup}
        title="Support Fantasy Toolkit — opens PayPal in a popup"
        className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${
            darkMode
                ? 'bg-[#0070ba]/20 text-[#6ec3ff] ring-1 ring-[#0070ba]/35 hover:bg-[#0070ba]/30'
                : 'bg-[#0070ba]/10 text-[#003087] ring-1 ring-[#0070ba]/25 hover:bg-[#0070ba]/15'
        } ${className}`}
    >
        <DonateIcon />
        {!compact && <span className="hidden sm:inline">Donate</span>}
        {compact && <span className="sr-only">Donate</span>}
    </button>
);

export default PayPalDonateButton;
