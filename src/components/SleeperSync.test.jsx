import React from 'react';
import { act, render } from '@testing-library/react';
import { useSleeperDraftSync } from '../hooks/useSleeperDraftSync';
import { buildPlayerIndex, matchPick } from '../utils/sleeperSync';
import SleeperSync from './SleeperSync';

jest.mock('../hooks/useSleeperDraftSync', () => ({
    useSleeperDraftSync: jest.fn(),
}));

jest.mock('../utils/sleeperSync', () => ({
    buildPlayerIndex: jest.fn(() => ({ byId: new Map() })),
    describePick: jest.fn(() => 'Unknown player'),
    matchPick: jest.fn(),
    parseDraftId: jest.fn((value) => value),
}));

const player = {
    id: 'player-1',
    name: 'Test Player',
    position: 'WR',
    team: 'SEA',
    photo: 'https://example.com/player.png',
    drafted: false,
};

describe('SleeperSync', () => {
    let syncOptions;

    beforeEach(() => {
        localStorage.clear();
        localStorage.setItem('sleeper-draft-id', JSON.stringify('draft-1'));
        localStorage.setItem('sleeper-sync-enabled', JSON.stringify(true));
        jest.clearAllMocks();
        matchPick.mockReturnValue(player.id);
        useSleeperDraftSync.mockImplementation((options) => {
            syncOptions = options;
            return {
                status: 'live',
                error: null,
                draft: null,
                lastSyncedAt: Date.now(),
            };
        });
    });

    it('reuses unchanged pick matches while still reapplying a reset player', () => {
        const onMarkDrafted = jest.fn();
        const pick = { pick_no: 1, player_id: 'sleeper-player-1' };
        const { rerender } = render(
            <SleeperSync
                players={[player]}
                darkMode={false}
                onMarkDrafted={onMarkDrafted}
            />
        );

        act(() => {
            syncOptions.onPicks([pick]);
        });
        expect(onMarkDrafted).toHaveBeenLastCalledWith([player.id]);
        expect(matchPick).toHaveBeenCalledTimes(1);

        rerender(
            <SleeperSync
                players={[{ ...player, drafted: true }]}
                darkMode={false}
                onMarkDrafted={onMarkDrafted}
            />
        );
        act(() => {
            syncOptions.onPicks([pick]);
        });
        expect(onMarkDrafted).toHaveBeenCalledTimes(1);
        expect(matchPick).toHaveBeenCalledTimes(1);

        rerender(
            <SleeperSync
                players={[{ ...player, drafted: false }]}
                darkMode={false}
                onMarkDrafted={onMarkDrafted}
            />
        );
        act(() => {
            syncOptions.onPicks([pick]);
        });
        expect(onMarkDrafted).toHaveBeenCalledTimes(2);
        expect(matchPick).toHaveBeenCalledTimes(1);
        expect(buildPlayerIndex).toHaveBeenCalledTimes(1);
    });
});
