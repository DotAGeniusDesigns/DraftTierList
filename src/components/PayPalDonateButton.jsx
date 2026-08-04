import React, { useEffect, useRef } from 'react';
import { PAYPAL_HOSTED_BUTTON_ID } from '../utils/routes';

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

const PayPalDonateButton = ({ compact = false, className = '' }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        loadPayPalDonateSdk()
            .then((PayPal) => {
                if (cancelled || !containerRef.current || !PayPal?.Donation?.Button) return;

                containerRef.current.innerHTML = '';
                PayPal.Donation.Button({
                    env: 'production',
                    hosted_button_id: PAYPAL_HOSTED_BUTTON_ID,
                    image: {
                        src: compact
                            ? 'https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif'
                            : 'https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif',
                        alt: 'Donate with PayPal button',
                        title: 'PayPal - The safer, easier way to pay online!',
                    },
                }).render(containerRef.current);
            })
            .catch(() => {
                // SDK blocked or offline — container stays empty.
            });

        return () => {
            cancelled = true;
        };
    }, [compact]);

    return (
        <div
            ref={containerRef}
            className={`paypal-donate-button flex shrink-0 items-center ${className}`}
            aria-label="Donate with PayPal"
        />
    );
};

export default PayPalDonateButton;
