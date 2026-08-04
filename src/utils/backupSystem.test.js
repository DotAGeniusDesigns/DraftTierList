import {
    flushScheduledBackup, getBackups, scheduleBackup,
} from './backupSystem';

const player = (id) => ({
    id,
    tier: 1,
    drafted: false,
    isRisky: false,
    isUpside: false,
    isHandcuff: false,
});

describe('scheduled backups', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.useFakeTimers();
        flushScheduledBackup();
        localStorage.clear();
    });

    afterEach(() => {
        flushScheduledBackup();
        jest.useRealTimers();
    });

    it('stores only the latest board after a reorder burst', () => {
        scheduleBackup([player('player-1')], 'player reorder', 2000);
        scheduleBackup([player('player-2')], 'player reorder', 2000);

        jest.advanceTimersByTime(1999);
        expect(getBackups()).toEqual({});

        jest.advanceTimersByTime(1);
        const backups = Object.values(getBackups());
        expect(backups).toHaveLength(1);
        expect(backups[0].players[0].id).toBe('player-2');
    });
});
