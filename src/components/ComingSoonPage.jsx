import React from 'react';
import { ui } from '../utils/uiTheme';

const ComingSoonPage = ({
    darkMode,
    title,
    subtitle,
    description,
    icon = '🏈',
    features = [],
}) => {
    return (
        <div>
            <div className="container mx-auto max-w-4xl px-4 py-10 sm:py-16">
                <div className={`${ui.card(darkMode)} overflow-hidden`}>
                    <div className="bg-gradient-to-r from-emerald-500/10 via-transparent to-teal-500/10 px-6 py-10 text-center sm:px-10 sm:py-14">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-3xl shadow-glow">
                            {icon}
                        </div>
                        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500">
                            Coming Soon
                        </p>
                        <h1 className={`font-display text-3xl font-bold tracking-tight sm:text-4xl ${ui.heading(darkMode)}`}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className={`mx-auto mt-4 max-w-2xl text-base sm:text-lg ${ui.muted(darkMode)}`}>
                                {subtitle}
                            </p>
                        )}
                        {description && (
                            <p className={`mx-auto mt-3 max-w-2xl text-sm leading-relaxed ${ui.muted(darkMode)}`}>
                                {description}
                            </p>
                        )}
                    </div>

                    {features.length > 0 && (
                        <div className="border-t border-slate-200/60 px-6 py-8 sm:px-10 dark:border-white/5">
                            <h3 className={`mb-5 text-center text-lg font-semibold ${ui.heading(darkMode)}`}>
                                Planned Features
                            </h3>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {features.map((feature) => (
                                    <div
                                        key={feature.title}
                                        className={`${ui.cardInset(darkMode)} flex items-start gap-3 p-4`}
                                    >
                                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm text-emerald-500">
                                            ✓
                                        </span>
                                        <div>
                                            <h4 className={`font-semibold ${ui.heading(darkMode)}`}>{feature.title}</h4>
                                            <p className={`mt-1 text-sm ${ui.muted(darkMode)}`}>{feature.detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ComingSoonPage;
