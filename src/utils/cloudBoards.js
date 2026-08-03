// Bridge between the board in the browser and the copy stored on an account.
//
// Cloud boards reuse the share-link codec from exportImport.js rather than
// inventing a second format. That keeps rows tiny (a few KB instead of the
// few hundred a full player dump would cost) and means a saved board survives
// database updates the same way a share link does: tiers, ordering, tier names
// and the user-set flags are stored, and everything else — photos, ADP, bye
// weeks, injuries — is rebuilt from the current local player database on load.

import { encodeBoardForShare, decodeSharedBoard } from './exportImport';
import { getTierNames } from './tierNames';
import { initialPlayers } from './playerData';

// Remembers which saved board this browser is working against, so the draft
// board can offer "Update" instead of always creating a new one.
const ACTIVE_BOARD_KEY = 'cloud-active-board';
export const ACTIVE_BOARD_CHANGED_EVENT = 'cloud-active-board-changed';
// Set once we have asked this user about uploading their local board, so the
// prompt does not reappear on every sign-in.
const UPLOAD_PROMPT_KEY = 'cloud-upload-prompted';

export const DEFAULT_BOARD_NAME = 'My Draft Board';

/** Serialises the live board into the string the API stores. */
export const encodeCurrentBoard = (players) => ({
    code: encodeBoardForShare(players, getTierNames()),
    playerCount: players.length,
});

/** Rebuilds a full board from a stored code. Throws on a corrupt payload. */
export const decodeCloudBoard = (code) => decodeSharedBoard(code);

export const getActiveBoardId = () => {
    try {
        return window.localStorage.getItem(ACTIVE_BOARD_KEY) || null;
    } catch {
        return null;
    }
};

export const setActiveBoardId = (id) => {
    try {
        if (id) window.localStorage.setItem(ACTIVE_BOARD_KEY, id);
        else window.localStorage.removeItem(ACTIVE_BOARD_KEY);
    } catch {
        // Private-mode Safari and friends; the app still works, it just forgets
        // which board was active.
    }
    window.dispatchEvent(new CustomEvent(ACTIVE_BOARD_CHANGED_EVENT, {
        detail: { id: id || null },
    }));
};

// Keyed by user id so two people sharing a browser are each asked once.
export const hasBeenPromptedToUpload = (userId) => {
    try {
        const raw = window.localStorage.getItem(UPLOAD_PROMPT_KEY);
        if (!raw) return false;
        return JSON.parse(raw).includes(userId);
    } catch {
        return false;
    }
};

export const markPromptedToUpload = (userId) => {
    try {
        const raw = window.localStorage.getItem(UPLOAD_PROMPT_KEY);
        const ids = raw ? JSON.parse(raw) : [];
        if (!ids.includes(userId)) ids.push(userId);
        window.localStorage.setItem(UPLOAD_PROMPT_KEY, JSON.stringify(ids));
    } catch {
        // Non-fatal: worst case the prompt shows again next session.
    }
};

/** True when the board differs from the untouched database default. */
export const boardHasCustomisations = (players) => (
    Object.keys(getTierNames()).length > 0
    || players.some((player, index) => (
        player.drafted
        || player.isUpside
        || player.isRisky
        || player.isHandcuff
        || Number(player.tier) !== 1
        || player.id !== initialPlayers[index]?.id
    ))
);

export const formatBoardTimestamp = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
};
