import React, { useState } from 'react';

const BurgerMenu = ({
    darkMode,
    onAddTier,
    onShowBackupManager,
    onShowExportImport,
    onShowResetConfirm
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleMenuItemClick = (action) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Burger Button */}
            <button
                onClick={toggleMenu}
                className={`p-2 rounded-md transition-colors ${darkMode
                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    } border`}
                aria-label="Menu"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg z-50 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    <div className="py-1">
                        {/* Draft Board Management */}
                        <div className={`px-4 py-2 text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            DRAFT BOARD
                        </div>

                        <button
                            onClick={() => handleMenuItemClick(onAddTier)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
                        >
                            ➕ Add Tier
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onShowBackupManager)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
                        >
                            💾 Saved Boards
                        </button>

                        <button
                            onClick={() => handleMenuItemClick(onShowExportImport)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
                        >
                            📤 Export/Import
                        </button>

                        {/* Settings */}
                        <div className={`px-4 py-2 text-xs font-semibold mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            SETTINGS
                        </div>



                        <button
                            onClick={() => handleMenuItemClick(onShowResetConfirm)}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600'}`}
                        >
                            ⚠️ Reset to Default
                        </button>
                    </div>
                </div>
            )}

            {/* Backdrop to close menu when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default BurgerMenu;
