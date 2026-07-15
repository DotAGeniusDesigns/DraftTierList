import React from 'react';

const Navbar = ({ darkMode, currentPage, onPageChange, onToggleDarkMode }) => {
    const navItems = [
        { id: 'draft-board', label: 'Draft Board', shortLabel: 'Board', icon: '📋' },
        { id: 'draft-range', label: 'Draft Range', shortLabel: 'Range', icon: '🎯' },
        { id: 'streamers', label: 'Streamers', shortLabel: 'Streams', icon: '⚡' },
        { id: 'interesting-players', label: 'Interesting Players', shortLabel: 'Players', icon: '⭐' }
    ];

    return (
        <nav className={`border-b transition-colors duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
                <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
                    <div className="flex items-center min-w-0">
                        <h1 className={`text-base sm:text-xl font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            <span className="sm:hidden">FF Tools</span>
                            <span className="hidden sm:inline">Fantasy Football Tools</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onPageChange(item.id)}
                                className={`px-2 sm:px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${currentPage === item.id
                                    ? darkMode
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-100 text-blue-700'
                                    : darkMode
                                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <span className="mr-1 sm:mr-2">{item.icon}</span>
                                <span className="sm:hidden">{item.shortLabel}</span>
                                <span className="hidden sm:inline">{item.label}</span>
                            </button>
                        ))}

                        <button
                            onClick={onToggleDarkMode}
                            className={`ml-1 sm:ml-2 p-2 rounded-md transition-colors ${darkMode
                                ? 'text-yellow-400 hover:bg-gray-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
