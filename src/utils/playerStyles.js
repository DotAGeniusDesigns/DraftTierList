// Shared position badge styles for light and dark mode.
export const getPositionTagClass = (position, { drafted = false, darkMode = false } = {}) => {
    if (drafted) {
        return darkMode
            ? 'bg-gray-600 text-gray-300'
            : 'bg-gray-300 text-gray-600';
    }

    const base = 'text-xs font-bold px-1 sm:px-2 py-1 rounded';

    const colors = {
        WR: darkMode ? 'bg-green-900/60 text-green-300' : 'bg-green-100 text-green-800',
        RB: darkMode ? 'bg-red-900/60 text-red-300' : 'bg-red-100 text-red-800',
        QB: darkMode ? 'bg-orange-900/60 text-orange-300' : 'bg-orange-100 text-orange-800',
        TE: darkMode ? 'bg-purple-900/60 text-purple-300' : 'bg-purple-100 text-purple-800',
        DST: darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700',
        K: darkMode ? 'bg-pink-900/60 text-pink-300' : 'bg-pink-100 text-pink-800',
    };

    return `${base} ${colors[position] || (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')}`;
};

export const getPositionFilterTagClass = (position) => {
    const base = 'text-xs font-bold px-2 py-1 rounded';
    const colors = {
        WR: 'bg-green-100 text-green-800',
        RB: 'bg-red-100 text-red-800',
        QB: 'bg-orange-100 text-orange-800',
        TE: 'bg-purple-100 text-purple-800',
        DST: 'bg-gray-200 text-gray-700',
        K: 'bg-pink-100 text-pink-800',
    };
    return `${base} ${colors[position] || 'bg-gray-200 text-gray-700'}`;
};
