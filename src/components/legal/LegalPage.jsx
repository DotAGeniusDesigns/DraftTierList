import React from 'react';
import { ui } from '../../utils/uiTheme';

// Shared typography for the policy pages. Kept deliberately plain: these are
// documents people skim for one specific answer, so headings and lists matter
// more than styling.

export const LegalSection = ({ darkMode, id, title, children }) => (
    <section id={id} className="scroll-mt-24">
        <h2 className={`mt-8 text-lg font-bold sm:text-xl ${ui.heading(darkMode)}`}>{title}</h2>
        <div className={`mt-3 space-y-3 text-sm leading-relaxed sm:text-base ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {children}
        </div>
    </section>
);

export const LegalList = ({ children }) => (
    <ul className="ml-5 list-disc space-y-2">{children}</ul>
);

const LegalPage = ({ darkMode, title, effectiveDate, summary, children }) => (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className={`${ui.card(darkMode)} p-6 sm:p-10`}>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                Legal
            </p>
            <h1 className={`font-display text-2xl font-bold tracking-tight sm:text-3xl ${ui.heading(darkMode)}`}>
                {title}
            </h1>
            <p className={`mt-2 text-sm ${ui.muted(darkMode)}`}>
                Effective {effectiveDate}
            </p>

            {summary && (
                <div className={`${ui.alert(darkMode, 'info')} mt-6`}>
                    <p className="font-semibold">The short version</p>
                    <p className="mt-1 leading-relaxed">{summary}</p>
                </div>
            )}

            {children}
        </div>
    </div>
);

export default LegalPage;
