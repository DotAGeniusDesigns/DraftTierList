import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { playerDatabase } from '../utils/playerDatabase';
import DraftKit from './DraftKit';

// The real board, trimmed: the filter is what is under test, and the page builds
// projections off every player it is handed.
const allPlayers = Object.values(playerDatabase).filter((p) => p.ecr && p.ecr <= 60);

const renderKit = () => render(<DraftKit darkMode={false} allPlayers={allPlayers} />);

const filterBar = () => screen.getByText('Position').parentElement;
// Matched case-insensitively so relabelling the control is a copy change, not a
// broken test.
const posButton = (position) =>
    within(filterBar()).getByRole('button', { name: new RegExp(`^${position}$`, 'i') });
const shownPositions = () =>
    screen.getAllByTestId('draftkit-position').map((el) => el.textContent);

describe('DraftKit position filter', () => {
    it('shows every position by default, with ALL selected', () => {
        renderKit();
        expect(posButton('ALL').getAttribute('aria-pressed')).toBe('true');
        expect(new Set(shownPositions()).size).toBeGreaterThan(1);
    });

    it('selects a single position on first click', () => {
        renderKit();
        fireEvent.click(posButton('WR'));
        expect(posButton('WR').getAttribute('aria-pressed')).toBe('true');
        expect(posButton('ALL').getAttribute('aria-pressed')).toBe('false');
        expect(new Set(shownPositions())).toEqual(new Set(['WR']));
    });

    it('combines positions when more than one is toggled on', () => {
        renderKit();
        fireEvent.click(posButton('WR'));
        fireEvent.click(posButton('RB'));
        expect(posButton('WR').getAttribute('aria-pressed')).toBe('true');
        expect(posButton('RB').getAttribute('aria-pressed')).toBe('true');
        expect(new Set(shownPositions())).toEqual(new Set(['WR', 'RB']));
    });

    it('toggles a position back off without clearing the others', () => {
        renderKit();
        fireEvent.click(posButton('WR'));
        fireEvent.click(posButton('RB'));
        fireEvent.click(posButton('WR'));
        expect(posButton('WR').getAttribute('aria-pressed')).toBe('false');
        expect(new Set(shownPositions())).toEqual(new Set(['RB']));
    });

    it('falls back to the whole board when the last position is toggled off', () => {
        renderKit();
        fireEvent.click(posButton('TE'));
        fireEvent.click(posButton('TE'));
        expect(posButton('ALL').getAttribute('aria-pressed')).toBe('true');
        expect(new Set(shownPositions()).size).toBeGreaterThan(1);
    });

    it('ALL clears an existing selection', () => {
        renderKit();
        fireEvent.click(posButton('QB'));
        fireEvent.click(posButton('TE'));
        fireEvent.click(posButton('ALL'));
        expect(posButton('QB').getAttribute('aria-pressed')).toBe('false');
        expect(posButton('TE').getAttribute('aria-pressed')).toBe('false');
        expect(new Set(shownPositions()).size).toBeGreaterThan(2);
    });
});
