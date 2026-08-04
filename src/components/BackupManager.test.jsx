import React from 'react';
import {
    fireEvent, render, screen,
} from '@testing-library/react';
import {
    clearAllBackups, getBackupSummary, getDraftBoardSummary,
} from '../utils/backupSystem';
import BackupManager from './BackupManager';

jest.mock('../utils/backupSystem', () => ({
    clearAllBackups: jest.fn(() => true),
    deleteBackup: jest.fn(),
    deleteDraftBoard: jest.fn(),
    getBackup: jest.fn(),
    getBackupSummary: jest.fn(() => [{
        timestamp: '2026-08-01T00:00:00.000Z',
        reason: 'Automatic safety copy',
        date: '8/1/2026',
        time: '12:00:00 AM',
        playerCount: 377,
    }]),
    getDraftBoardSummary: jest.fn(() => [{
        id: 'board-1',
        name: 'League board',
        description: 'PPR',
        date: '8/2/2026',
        time: '12:00:00 AM',
        playerCount: 377,
    }]),
    loadDraftBoard: jest.fn(),
    restoreFromBackup: jest.fn(),
    saveDraftBoard: jest.fn(),
}));

const renderManager = (onClose = jest.fn()) => render(
    <BackupManager
        players={[]}
        onRestorePlayers={jest.fn()}
        darkMode={false}
        onClose={onClose}
    />
);

describe('BackupManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        clearAllBackups.mockReturnValue(true);
        getBackupSummary.mockReturnValue([{
            timestamp: '2026-08-01T00:00:00.000Z',
            reason: 'Automatic safety copy',
            date: '8/1/2026',
            time: '12:00:00 AM',
            playerCount: 377,
        }]);
        getDraftBoardSummary.mockReturnValue([{
            id: 'board-1',
            name: 'League board',
            description: 'PPR',
            date: '8/2/2026',
            time: '12:00:00 AM',
            playerCount: 377,
        }]);
    });

    it('shows saved boards and backups under the correct tabs', () => {
        renderManager();

        expect(screen.getByText('League board')).not.toBeNull();
        expect(screen.queryByText('Automatic safety copy')).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: /Backups/ }));
        expect(screen.getByText('Automatic safety copy')).not.toBeNull();
        expect(screen.queryByText('League board')).toBeNull();
    });

    it('requires confirmation before clearing every backup', () => {
        renderManager();
        fireEvent.click(screen.getByRole('button', { name: /Backups/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Clear All Backups' }));

        expect(clearAllBackups).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Yes, clear all' }));
        expect(clearAllBackups).toHaveBeenCalledTimes(1);
    });

    it('is labelled as a dialog and closes with Escape', () => {
        const onClose = jest.fn();
        renderManager(onClose);

        expect(screen.getByRole('dialog', { name: 'Saved Boards' })).not.toBeNull();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
