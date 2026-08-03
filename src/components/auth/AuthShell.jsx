import React from 'react';
import { Link } from 'react-router-dom';
import { ui } from '../../utils/uiTheme';

// Shared frame for the sign in / sign up / reset pages: centred card, brand
// eyebrow, and the legal footnote that has to appear wherever we collect an
// email address.
const AuthShell = ({ darkMode, title, subtitle, children, footer, showLegal = false }) => (
    <div className="container mx-auto max-w-md px-4 py-10 sm:py-16">
        <div className={`${ui.card(darkMode)} p-6 sm:p-8`}>
            <div className="mb-6 text-center">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-500">
                    Fantasy Toolkit
                </p>
                <h1 className={`font-display text-2xl font-bold tracking-tight sm:text-3xl ${ui.heading(darkMode)}`}>
                    {title}
                </h1>
                {subtitle && (
                    <p className={`mt-2 text-sm leading-relaxed ${ui.muted(darkMode)}`}>{subtitle}</p>
                )}
            </div>

            {children}
        </div>

        {footer && (
            <div className={`mt-5 text-center text-sm ${ui.muted(darkMode)}`}>{footer}</div>
        )}

        {showLegal && (
            <p className={`mt-6 text-center text-xs leading-relaxed ${ui.muted(darkMode)}`}>
                By continuing you agree to our{' '}
                <Link to="/terms" className="font-semibold text-emerald-500 hover:text-emerald-400">
                    Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="font-semibold text-emerald-500 hover:text-emerald-400">
                    Privacy Policy
                </Link>
                .
            </p>
        )}
    </div>
);

export default AuthShell;
