import React, { useState } from 'react';
import { searchPlayer } from '../utils/espnApi';

const PlayerPhotoTest = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const testPlayers = [
        'Saquon Barkley',
        'Ja\'Marr Chase',
        'Justin Jefferson',
        'Jahmyr Gibbs',
        'CeeDee Lamb'
    ];

    const testPlayerPhotos = async () => {
        setLoading(true);
        const playerResults = [];

        for (const playerName of testPlayers) {
            try {
                console.log(`Searching for: ${playerName}`);
                const player = await searchPlayer(playerName);
                if (player) {
                    console.log(`Found player:`, player);
                    playerResults.push(player);
                } else {
                    console.log(`No player found for: ${playerName}`);
                }
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Error searching for ${playerName}:`, error);
            }
        }

        setResults(playerResults);
        setLoading(false);
    };

    return (
        <div className="p-6 bg-white rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold mb-4">Player Photo Test - Finding Correct ESPN IDs</h3>

            <button
                onClick={testPlayerPhotos}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
                {loading ? 'Searching ESPN API...' : 'Find Correct Player IDs'}
            </button>

            {results.length > 0 && (
                <div className="space-y-4">
                    <h4 className="font-semibold">Results from ESPN API:</h4>
                    {results.map((player, index) => (
                        <div key={index} className="border border-gray-200 rounded p-3">
                            <div className="flex items-center gap-4">
                                <img
                                    src={player.photoUrl}
                                    alt={player.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                    onError={(e) => {
                                        console.error(`Failed to load image for ${player.name}:`, player.photoUrl);
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold" style={{ display: 'none' }}>
                                    {player.name.split(' ').map(n => n[0]).join('')}
                                </div>

                                <div>
                                    <div className="font-semibold">{player.name}</div>
                                    <div className="text-sm text-gray-600">{player.position} • {player.team}</div>
                                    <div className="text-xs text-gray-500">ESPN ID: {player.id}</div>
                                    <div className="text-xs text-gray-500">Photo URL: {player.photoUrl}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {loading && (
                <div className="text-gray-600">
                    Searching ESPN API for player IDs... This may take a moment.
                </div>
            )}
        </div>
    );
};

export default PlayerPhotoTest; 