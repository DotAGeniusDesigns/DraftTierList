import React from 'react';
import { Link } from 'react-router-dom';
import { ui } from '../utils/uiTheme';
import { SITE_NAME } from '../utils/legalConfig';

// Site-wide footer. Its main job is making the policy pages reachable from
// every page, which is expected once an app collects email addresses.
const Footer = ({ darkMode }) => (
    <footer className={`mt-12 border-t ${darkMode ? 'border-white/5' : 'border-slate-200/70'}`}>
        <div className="container mx-auto max-w-7xl px-4 py-8">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className={`text-xs ${ui.muted(darkMode)}`}>
                    © {new Date().getFullYear()} {SITE_NAME}. Not affiliated with the NFL or any fantasy platform.
                </p>

                <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                    <Link
                        to="/privacy"
                        className={`text-xs font-medium transition ${
                            darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Privacy Policy
                    </Link>
                    <Link
                        to="/terms"
                        className={`text-xs font-medium transition ${
                            darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Terms of Service
                    </Link>
                </nav>
            </div>
        </div>
    </footer>
);

export default Footer;
