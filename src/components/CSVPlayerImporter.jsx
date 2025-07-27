import React, { useState } from 'react';

const CSVPlayerImporter = () => {
    const [showImporter, setShowImporter] = useState(false);
    const [csvData, setCsvData] = useState('');
    const [importedPlayers, setImportedPlayers] = useState([]);
    const [errors, setErrors] = useState([]);

    const handleCSVUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCsvData(e.target.result);
                parseCSV(e.target.result);
            };
            reader.readAsText(file);
        }
    };

    const handleCSVPaste = (event) => {
        const pastedData = event.target.value;
        setCsvData(pastedData);
        parseCSV(pastedData);
    };

    const parseCSV = (csvText) => {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        const players = [];
        const newErrors = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = line.split(',').map(v => v.trim());

            if (values.length < headers.length) {
                newErrors.push(`Line ${i + 1}: Not enough columns`);
                continue;
            }

            const player = {};
            headers.forEach((header, index) => {
                player[header] = values[index];
            });

            // Map the user's column format to our database format
            const mappedPlayer = {
                id: generatePlayerId(player['player name'] || player['playername'] || player.name),
                name: player['player name'] || player['playername'] || player.name,
                position: player['pos'] || player.position,
                team: player['team'],
                tier: parseInt(player['tiers'] || player.tier || 1),
                photo: player['photo'] || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face'
            };

            // Validate required fields
            if (!mappedPlayer.name || !mappedPlayer.position || !mappedPlayer.team) {
                newErrors.push(`Line ${i + 1}: Missing required fields (PLAYER NAME, POS, TEAM)`);
                continue;
            }

            players.push(mappedPlayer);
        }

        setImportedPlayers(players);
        setErrors(newErrors);
    };

    // Generate a player ID from the name
    const generatePlayerId = (name) => {
        if (!name) return '';
        return name.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .trim();
    };

    const handleImport = () => {
        if (importedPlayers.length === 0) {
            alert('No valid players to import');
            return;
        }

        // Log the players to console for easy copying
        console.log('=== IMPORTED PLAYERS ===');
        importedPlayers.forEach(player => {
            console.log(`'${player.id}': {`);
            console.log(`    id: '${player.id}',`);
            console.log(`    name: '${player.name}',`);
            console.log(`    position: '${player.position}',`);
            console.log(`    team: '${player.team}',`);
            console.log(`    photo: '${player.photo}',`);
            console.log(`    tier: ${player.tier}`);
            console.log(`},`);
        });
        console.log('=== END IMPORTED PLAYERS ===');

        alert(`Successfully imported ${importedPlayers.length} players! Check the console for the code to copy.`);
    };

    const downloadTemplate = () => {
        const template = `TIERS,PLAYER NAME,TEAM,POS,photo
1,Saquon Barkley,PHI,RB,https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face
1,Ja'Marr Chase,CIN,WR,https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face
2,Justin Jefferson,MIN,WR,https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop&crop=face`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'player_import_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="mb-6">
            <button
                onClick={() => setShowImporter(!showImporter)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-4"
            >
                {showImporter ? 'Hide' : 'Show'} CSV Player Importer
            </button>

            {showImporter && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold mb-4">CSV Player Importer</h3>

                    {/* Instructions */}
                    <div className="mb-6 p-4 bg-blue-50 rounded">
                        <h4 className="font-semibold mb-2">How to Import Players:</h4>
                        <ol className="text-sm text-gray-700 space-y-1">
                            <li>1. Download the CSV template below (matches your format)</li>
                            <li>2. Fill it with your player data</li>
                            <li>3. Upload or paste the CSV data</li>
                            <li>4. Review the imported players</li>
                            <li>5. Click "Import Players" to get the code</li>
                            <li>6. Copy the console output to <code>playerDatabase.js</code></li>
                        </ol>
                    </div>

                    {/* Download Template */}
                    <div className="mb-6">
                        <button
                            onClick={downloadTemplate}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Download CSV Template (Your Format)
                        </button>
                    </div>

                    {/* Upload/Paste CSV */}
                    <div className="mb-6">
                        <h4 className="font-semibold mb-3">Upload or Paste CSV Data</h4>

                        {/* File Upload */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload CSV File:
                            </label>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleCSVUpload}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Paste CSV */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Or Paste CSV Data:
                            </label>
                            <textarea
                                value={csvData}
                                onChange={handleCSVPaste}
                                placeholder="Paste your CSV data here..."
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
                            <h4 className="font-semibold text-red-800 mb-2">Errors Found:</h4>
                            <ul className="text-sm text-red-700 space-y-1">
                                {errors.map((error, index) => (
                                    <li key={index}>• {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Imported Players Preview */}
                    {importedPlayers.length > 0 && (
                        <div className="mb-6">
                            <h4 className="font-semibold mb-3">
                                Imported Players ({importedPlayers.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                                {importedPlayers.map((player, index) => (
                                    <div key={index} className="border border-gray-200 rounded p-3">
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
                    )}

                    {/* Import Button */}
                    {importedPlayers.length > 0 && (
                        <div>
                            <button
                                onClick={handleImport}
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                Import {importedPlayers.length} Players
                            </button>
                        </div>
                    )}

                    {/* CSV Format Info */}
                    <div className="mt-6 p-4 bg-gray-50 rounded">
                        <h4 className="font-semibold mb-2">Your CSV Format:</h4>
                        <div className="text-sm text-gray-700">
                            <p><strong>Required columns:</strong> TIERS, PLAYER NAME, TEAM, POS</p>
                            <p><strong>Optional columns:</strong> photo (default: placeholder)</p>
                            <p><strong>Example:</strong></p>
                            <code className="block bg-gray-100 p-2 rounded text-xs">
                                TIERS,PLAYER NAME,TEAM,POS,photo<br />
                                1,Saquon Barkley,PHI,RB,https://example.com/photo.jpg
                            </code>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CSVPlayerImporter; 