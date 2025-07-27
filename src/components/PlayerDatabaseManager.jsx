import React, { useState } from 'react';
import { playerDatabase, getAllPlayers } from '../utils/playerDatabase';

const PlayerDatabaseManager = () => {
    const [showManager, setShowManager] = useState(false);
    const [newPlayer, setNewPlayer] = useState({
        id: '',
        name: '',
        position: '',
        team: '',
        tier: 1,
        photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face'
    });

    const handleAddPlayer = () => {
        // In a real app, you'd save this to the database
        console.log('Adding new player:', newPlayer);
        alert(`Player "${newPlayer.name}" would be added to the database. In a real app, this would save to your database.`);

        // Reset form
        setNewPlayer({
            id: '',
            name: '',
            position: '',
            team: '',
            tier: 1,
            photo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face'
        });
    };

    const allPlayers = getAllPlayers();

    return (
        <div className="mb-6">
            <button
                onClick={() => setShowManager(!showManager)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
            >
                {showManager ? 'Hide' : 'Show'} Player Database Manager
            </button>

            {showManager && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">Player Database Manager</h3>

                    {/* Add New Player Form */}
                    <div className="mb-6 p-4 bg-gray-50 rounded">
                        <h4 className="font-semibold mb-3">Add New Player</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Player ID</label>
                                <input
                                    type="text"
                                    value={newPlayer.id}
                                    onChange={(e) => setNewPlayer({ ...newPlayer, id: e.target.value })}
                                    placeholder="e.g., christian-mccaffrey"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newPlayer.name}
                                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                                    placeholder="e.g., Christian McCaffrey"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                                <select
                                    value={newPlayer.position}
                                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Position</option>
                                    <option value="QB">QB</option>
                                    <option value="RB">RB</option>
                                    <option value="WR">WR</option>
                                    <option value="TE">TE</option>
                                    <option value="K">K</option>
                                    <option value="DEF">DEF</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                                <input
                                    type="text"
                                    value={newPlayer.team}
                                    onChange={(e) => setNewPlayer({ ...newPlayer, team: e.target.value })}
                                    placeholder="e.g., SF"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                                <select
                                    value={newPlayer.tier}
                                    onChange={(e) => setNewPlayer({ ...newPlayer, tier: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={1}>Tier 1</option>
                                    <option value={2}>Tier 2</option>
                                    <option value={3}>Tier 3</option>
                                    <option value={4}>Tier 4</option>
                                    <option value={5}>Tier 5</option>
                                    <option value={6}>Tier 6</option>
                                    <option value={7}>Tier 7</option>
                                    <option value={8}>Tier 8</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                                <input
                                    type="text"
                                    value={newPlayer.photo}
                                    onChange={(e) => setNewPlayer({ ...newPlayer, photo: e.target.value })}
                                    placeholder="Photo URL"
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleAddPlayer}
                            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Add Player to Database
                        </button>
                    </div>

                    {/* Current Database */}
                    <div>
                        <h4 className="font-semibold mb-3">Current Database ({allPlayers.length} players)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                            {allPlayers.map((player) => (
                                <div key={player.id} className="border border-gray-200 rounded p-3">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={player.photo}
                                            alt={player.name}
                                            className="w-12 h-12 rounded-full object-cover"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold" style={{ display: 'none' }}>
                                            {player.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm">{player.name}</div>
                                            <div className="text-xs text-gray-600">{player.position} • {player.team}</div>
                                            <div className="text-xs text-gray-500">Tier {player.tier}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6 p-4 bg-blue-50 rounded">
                        <h4 className="font-semibold mb-2">How to Add Players:</h4>
                        <ol className="text-sm text-gray-700 space-y-1">
                            <li>1. Fill out the form above with player information</li>
                            <li>2. Click "Add Player to Database"</li>
                            <li>3. Copy the console output and add it to <code>src/utils/playerDatabase.js</code></li>
                            <li>4. Refresh the app to see the new player</li>
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerDatabaseManager; 