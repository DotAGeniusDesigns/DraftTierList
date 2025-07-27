import React from 'react';
import { getTeamLogoUrl } from '../utils/espnApi';

const TeamLogoTest = () => {
    const testTeams = ['PHI', 'KC', 'CIN', 'DAL', 'DET', 'BAL'];

    return (
        <div className="p-6 bg-white rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold mb-4">Team Logo Test</h3>
            <div className="flex gap-4 flex-wrap">
                {testTeams.map(team => (
                    <div key={team} className="text-center">
                        <div className="w-12 h-12 mb-2">
                            <img
                                src={getTeamLogoUrl(team)}
                                alt={team}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    console.error(`Failed to load logo for ${team}`);
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                }}
                            />
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold" style={{ display: 'none' }}>
                                {team}
                            </div>
                        </div>
                        <div className="text-xs text-gray-600">{team}</div>
                    </div>
                ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
                <p>If you see team logos above, they're working! If you see team abbreviations, there might be a loading issue.</p>
            </div>
        </div>
    );
};

export default TeamLogoTest; 