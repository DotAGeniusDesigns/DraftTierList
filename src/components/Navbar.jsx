import React from 'react';

const Navbar = ({ darkMode, currentPage, onPageChange, onToggleDarkMode }) => {
    const navItems = [
        { id: 'draft-board', label: 'Draft Board', icon: '📋' },
        { id: 'draft-range', label: 'Draft Range', icon: '🎯' },
        { id: 'streamers', label: 'Streamers', icon: '⚡' }
    ];

    return (
        <nav className={`border-b transition-colors duration-200 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center">
                        <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Fantasy Football Tools
                        </h1>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-1 sm:space-x-4">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onPageChange(item.id)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === item.id
                                    ? darkMode
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-100 text-blue-700'
                                    : darkMode
                                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}

                        {/* Dark Mode Toggle */}
                        <button
                            onClick={onToggleDarkMode}
                            className={`ml-4 p-2 rounded-md transition-colors ${darkMode
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
