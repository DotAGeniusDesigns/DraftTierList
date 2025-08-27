import React, { useState, useEffect } from 'react';
import {
    getBackupSummary, getBackup, restoreFromBackup, deleteBackup, clearAllBackups,
    getDraftBoardSummary, getDraftBoard, loadDraftBoard, deleteDraftBoard, saveDraftBoard
} from '../utils/backupSystem';

const BackupManager = ({ players, onRestorePlayers, darkMode, onClose }) => {
    const [activeTab, setActiveTab] = useState('draftboards'); // 'draftboards' or 'backups'
    const [backups, setBackups] = useState([]);
    const [draftBoards, setDraftBoards] = useState([]);
    const [selectedBackup, setSelectedBackup] = useState(null);
    const [selectedDraftBoard, setSelectedDraftBoard] = useState(null);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showSaveDraftBoard, setShowSaveDraftBoard] = useState(false);
    const [newDraftBoardName, setNewDraftBoardName] = useState('');
    const [newDraftBoardDescription, setNewDraftBoardDescription] = useState('');

    useEffect(() => {
        // Load backup summary and draft boards when component mounts
        setBackups(getBackupSummary());
        setDraftBoards(getDraftBoardSummary());
    }, []);

    const handleRestore = (backup) => {
        setSelectedBackup(backup);
        setShowRestoreConfirm(true);
    };

    const confirmRestore = () => {
        if (selectedBackup) {
            const backupData = getBackup(selectedBackup.timestamp);
            if (backupData) {
                const restoredPlayers = restoreFromBackup(backupData, players);
                if (restoredPlayers) {
                    onRestorePlayers(restoredPlayers);
                    onClose();
                }
            }
        }
        setShowRestoreConfirm(false);
        setSelectedBackup(null);
    };

    const handleDelete = (backup) => {
        setSelectedBackup(backup);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (selectedBackup) {
            if (deleteBackup(selectedBackup.timestamp)) {
                setBackups(getBackupSummary());
            }
        }
        setShowDeleteConfirm(false);
        setSelectedBackup(null);
    };

    const handleClearAll = () => {
        if (clearAllBackups()) {
            setBackups([]);
        }
    };

    // Draft Board Management
    const handleSaveDraftBoard = () => {
        if (newDraftBoardName.trim()) {
            if (saveDraftBoard(players, newDraftBoardName.trim(), newDraftBoardDescription.trim())) {
                setDraftBoards(getDraftBoardSummary());
                setNewDraftBoardName('');
                setNewDraftBoardDescription('');
                setShowSaveDraftBoard(false);
            }
        }
    };

    const handleLoadDraftBoard = (draftBoard) => {
        setSelectedDraftBoard(draftBoard);
        setShowRestoreConfirm(true);
    };

    const confirmLoadDraftBoard = () => {
        if (selectedDraftBoard) {
            const loadedPlayers = loadDraftBoard(selectedDraftBoard.id, players);
            if (loadedPlayers) {
                onRestorePlayers(loadedPlayers);
                onClose();
            }
        }
        setShowRestoreConfirm(false);
        setSelectedDraftBoard(null);
    };

    const handleDeleteDraftBoard = (draftBoard) => {
        setSelectedDraftBoard(draftBoard);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteDraftBoard = () => {
        if (selectedDraftBoard) {
            if (deleteDraftBoard(selectedDraftBoard.id)) {
                setDraftBoards(getDraftBoardSummary());
            }
        }
        setShowDeleteConfirm(false);
        setSelectedDraftBoard(null);
    };

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {/* Header */}
                <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Saved Boards
                        </h2>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-md hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                            ✕
                        </button>
                    </div>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Save and manage multiple draft board configurations
                    </p>
                </div>

                {/* Tabs */}
                <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('draftboards')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'draftboards'
                                ? `${darkMode ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600'} border-b-2`
                                : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                                }`}
                        >
                            📋 Saved Boards ({draftBoards.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('backups')}
                            className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'backups'
                                ? `${darkMode ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600'} border-b-2`
                                : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`
                                }`}
                        >
                            💾 Backups ({backups.length})
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'draftboards' ? (
                        // Draft Boards Tab
                        <>
                            {backups.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        No backups found
                                    </p>
                                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Backups are created automatically every 24 hours and when you make changes
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Backup List */}
                                    {backups.map((backup) => (
                                        <div
                                            key={backup.timestamp}
                                            className={`p-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                            {backup.reason}
                                                        </span>
                                                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {backup.date} at {backup.time}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Players: </span>
                                                            <span className="font-medium">{backup.playerCount}</span>
                                                        </div>
                                                        <div>
                                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>First: </span>
                                                            <span className="font-medium">{backup.firstPlayer}</span>
                                                        </div>
                                                        <div>
                                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Last: </span>
                                                            <span className="font-medium">{backup.lastPlayer}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleRestore(backup)}
                                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                            }`}
                                                    >
                                                        Restore
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(backup)}
                                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                                            : 'bg-red-500 hover:bg-red-600 text-white'
                                                            }`}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Clear All Button */}
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <button
                                            onClick={handleClearAll}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                                                }`}
                                        >
                                            Clear All Backups
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // Draft Boards Tab
                        <>
                            {/* Save Current Draft Board Button */}
                            <div className="mb-6">
                                <button
                                    onClick={() => setShowSaveDraftBoard(true)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                        }`}
                                >
                                    💾 Save Current Draft Board
                                </button>
                            </div>

                            {draftBoards.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        No saved draft boards
                                    </p>
                                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        Save your current draft board to create different configurations for different league settings
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Draft Board List */}
                                    {draftBoards.map((board) => (
                                        <div
                                            key={board.id}
                                            className={`p-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <span className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {board.name}
                                                        </span>
                                                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {board.date} at {board.time}
                                                        </span>
                                                    </div>
                                                    {board.description && (
                                                        <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                            {board.description}
                                                        </p>
                                                    )}
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Players: </span>
                                                            <span className="font-medium">{board.playerCount}</span>
                                                        </div>
                                                        <div>
                                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>First: </span>
                                                            <span className="font-medium">{board.firstPlayer}</span>
                                                        </div>
                                                        <div>
                                                            <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Last: </span>
                                                            <span className="font-medium">{board.lastPlayer}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleLoadDraftBoard(board)}
                                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                            }`}
                                                    >
                                                        Load
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDraftBoard(board)}
                                                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                                            : 'bg-red-500 hover:bg-red-600 text-white'
                                                            }`}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Restore Confirmation Modal */}
            {showRestoreConfirm && (
                <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className={`max-w-md w-full p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {selectedDraftBoard ? 'Load Draft Board?' : 'Restore Backup?'}
                        </h3>
                        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            This will {selectedDraftBoard ? 'load' : 'restore'} your draft board to the state it was in on{' '}
                            <strong>{selectedDraftBoard ? selectedDraftBoard.date : selectedBackup?.date} at {selectedDraftBoard ? selectedDraftBoard.time : selectedBackup?.time}</strong>.
                            <br /><br />
                            <strong>Warning:</strong> This will overwrite your current draft board order.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowRestoreConfirm(false)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={selectedDraftBoard ? confirmLoadDraftBoard : confirmRestore}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            >
                                {selectedDraftBoard ? 'Yes, Load' : 'Yes, Restore'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className={`max-w-md w-full p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {selectedDraftBoard ? 'Delete Draft Board?' : 'Delete Backup?'}
                        </h3>
                        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            This will permanently delete the {selectedDraftBoard ? 'draft board' : 'backup'} from{' '}
                            <strong>{selectedDraftBoard ? selectedDraftBoard.date : selectedBackup?.date} at {selectedDraftBoard ? selectedDraftBoard.time : selectedBackup?.time}</strong>.
                            <br /><br />
                            This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={selectedDraftBoard ? confirmDeleteDraftBoard : confirmDelete}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Draft Board Modal */}
            {showSaveDraftBoard && (
                <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <div className={`max-w-md w-full p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Save Draft Board
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={newDraftBoardName}
                                    onChange={(e) => setNewDraftBoardName(e.target.value)}
                                    placeholder="e.g., PPR League, Standard Scoring, etc."
                                    className={`w-full px-3 py-2 border rounded-md ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Description (optional)
                                </label>
                                <textarea
                                    value={newDraftBoardDescription}
                                    onChange={(e) => setNewDraftBoardDescription(e.target.value)}
                                    placeholder="e.g., 12-team PPR league with 2 RB, 3 WR, 1 TE"
                                    rows={3}
                                    className={`w-full px-3 py-2 border rounded-md ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => {
                                    setShowSaveDraftBoard(false);
                                    setNewDraftBoardName('');
                                    setNewDraftBoardDescription('');
                                }}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${darkMode
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveDraftBoard}
                                disabled={!newDraftBoardName.trim()}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${newDraftBoardName.trim()
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                                    }`}
                            >
                                Save Draft Board
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BackupManager;
