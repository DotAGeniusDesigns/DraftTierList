import React from 'react';
import {
    fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { api } from '../utils/apiClient';
import { encodeCurrentBoard, formatBoardTimestamp } from '../utils/cloudBoards';
import SavedBoardsPanel from './SavedBoardsPanel';

jest.mock('../utils/apiClient', () => ({
    api: {
        createBoard: jest.fn(),
        deleteBoard: jest.fn(),
        getBoard: jest.fn(),
        listBoards: jest.fn(),
        updateBoard: jest.fn(),
    },
}));

jest.mock('../utils/cloudBoards', () => ({
    DEFAULT_BOARD_NAME: 'My board',
    encodeCurrentBoard: jest.fn(() => ({ code: 'board-code', playerCount: 1 })),
    formatBoardTimestamp: jest.fn(() => 'just now'),
    getActiveBoardId: jest.fn(() => null),
    setActiveBoardId: jest.fn(),
}));

describe('SavedBoardsPanel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        encodeCurrentBoard.mockReturnValue({ code: 'board-code', playerCount: 1 });
        formatBoardTimestamp.mockReturnValue('just now');
        api.listBoards.mockResolvedValue({
            boards: [{
                id: 'board-1',
                name: 'League board',
                playerCount: 1,
                updatedAt: new Date().toISOString(),
            }],
        });
        api.updateBoard.mockResolvedValue({ board: { id: 'board-1' } });
    });

    it('requires confirmation before overwriting a cloud board', async () => {
        render(
            <MemoryRouter>
                <SavedBoardsPanel
                    darkMode={false}
                    players={[{ id: 'player-1' }]}
                    onLoadBoard={jest.fn()}
                />
            </MemoryRouter>
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Update' }));
        expect(api.updateBoard).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Confirm update' }));
        await waitFor(() => expect(api.updateBoard).toHaveBeenCalledWith(
            'board-1',
            { code: 'board-code', playerCount: 1 },
        ));
    });
});
