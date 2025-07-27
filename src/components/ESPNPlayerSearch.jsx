import React, { useState } from 'react';
import { searchPlayer, getPlayerPhotoUrl, getTeamLogoUrl } from '../utils/espnApi';

const ESPNPlayerSearch = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        setLoading(true);
        setError('');
        setPlayer(null);

        try {
            const result = await searchPlayer(searchTerm);
            if (result) {
                setPlayer(result);
            } else {
                setError('Player not found');
            }
        } catch (err) {
            setError('Error searching for player');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg border border-gray-200 max-w-md">
            <h3 className="text-lg font-semibold mb-4">ESPN Player Search</h3>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter player name..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {error && (
                <div className="text-red-600 text-sm mb-4">{error}</div>
            )}

            {player && (
                <div className="border border-gray-200 rounded p-4">
                    <div className="flex items-center gap-4 mb-3">
                        <img
                            src={player.photoUrl}
                            alt={player.name}
                            className="w-16 h-16 rounded-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold" style={{ display: 'none' }}>
                            {player.name.split(' ').map(n => n[0]).join('')}
                        </div>

                        <div>
                            <h4 className="font-semibold">{player.name}</h4>
                            <p className="text-sm text-gray-600">{player.position} • {player.team}</p>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500">
                        <p><strong>ESPN ID:</strong> {player.id}</p>
                        <p><strong>Photo URL:</strong> {player.photoUrl}</p>
                        {player.team && (
                            <p><strong>Team Logo:</strong> {getTeamLogoUrl(player.team)}</p>
                        )}
                    </div>
                </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
                <p><strong>Example searches:</strong></p>
                <ul className="list-disc list-inside mt-1">
                    <li>Patrick Mahomes</li>
                    <li>Saquon Barkley</li>
                    <li>Ja'Marr Chase</li>
                </ul>
            </div>
        </div>
    );
};

export default ESPNPlayerSearch; 