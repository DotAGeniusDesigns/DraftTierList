import React, { useState } from 'react';
import { ui } from '../utils/uiTheme';

const BurgerMenu = ({
    darkMode,
    onAddTier,
    onShowBackupManager,
    onShowExportImport,
    onShowResetConfirm,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleMenuItemClick = (action) => {
        action();
        setIsOpen(false);
    };

    const itemClass = darkMode
        ? 'w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 transition hover:bg-white/5'
        : 'w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50';

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={ui.btn(darkMode)}
                aria-label="Menu"
            >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {isOpen && (
                <div className={`absolute right-0 z-50 mt-2 w-60 p-2 ${ui.dropdown(darkMode)}`}>
                    <div className={`px-3 py-2 text-[11px] font-bold uppercase tracking-wider ${ui.muted(darkMode)}`}>
                        Draft Board
                    </div>
                    <button onClick={() => handleMenuItemClick(onAddTier)} className={itemClass}>
                        ➕ Add Tier
                    </button>
                    <button onClick={() => handleMenuItemClick(onShowBackupManager)} className={itemClass}>
                        💾 Saved Boards
                    </button>
                    <button onClick={() => handleMenuItemClick(onShowExportImport)} className={itemClass}>
                        📤 Export / Import
                    </button>

                    <div className={`mt-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wider ${ui.muted(darkMode)}`}>
                        Settings
                    </div>
                    <button
                        onClick={() => handleMenuItemClick(onShowResetConfirm)}
                        className={`${itemClass} ${darkMode ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-600 hover:bg-rose-50'}`}
                    >
                        ⚠️ Reset to Default (ranked by ECR)
                    </button>
                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
};

export default BurgerMenu;
