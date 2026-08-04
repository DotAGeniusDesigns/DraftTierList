import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { ui } from '../utils/uiTheme';
import { NAV_ROUTES } from '../utils/routes';

const NotFoundPage = ({ darkMode }) => (
    <div className="container mx-auto max-w-2xl px-4 py-16 sm:py-24">
        <div className={`${ui.card(darkMode)} p-8 text-center sm:p-12`}>
            <div className="mx-auto mb-6 flex justify-center">
                <BrandLogo className="h-16 w-16 sm:h-20 sm:w-20" />
            </div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-500">
                404
            </p>
            <h1 className={`font-display text-3xl font-bold tracking-tight sm:text-4xl ${ui.heading(darkMode)}`}>
                Page not found
            </h1>
            <p className={`mx-auto mt-4 max-w-md text-sm leading-relaxed sm:text-base ${ui.muted(darkMode)}`}>
                That URL doesn&apos;t match anything on Fantasy Toolkit. Head back to the draft board
                or pick one of the tools below.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/draft-board" className={ui.btnPrimary()}>
                    Go to Draft Board
                </Link>
                <Link to="/offseason" className={ui.btn(darkMode)}>
                    Offseason HQ
                </Link>
            </div>

            <div className={`mt-10 border-t pt-6 ${darkMode ? 'border-white/5' : 'border-slate-200'}`}>
                <p className={`mb-3 text-xs font-semibold uppercase tracking-[0.14em] ${ui.muted(darkMode)}`}>
                    Popular tools
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    {NAV_ROUTES.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                darkMode
                                    ? 'bg-slate-800/70 text-slate-300 ring-1 ring-white/5 hover:bg-slate-700/70'
                                    : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200 hover:bg-white'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default NotFoundPage;
