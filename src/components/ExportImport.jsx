import React, { useState } from 'react';
import { exportTierList, importTierList, validateImportCode, getImportInfo, buildShareUrl } from '../utils/exportImport';
import { getTierNames } from '../utils/tierNames';

const ExportImport = ({ players, onImportPlayers, darkMode }) => {
    const [importCode, setImportCode] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [importInfo, setImportInfo] = useState(null);
    const [shareUrl, setShareUrl] = useState('');

    const handleExport = async () => {
        setIsExporting(true);
        setMessage('');

        try {
            const exportCode = exportTierList(players);
            await navigator.clipboard.writeText(exportCode);
            setMessage('Tier list copied to clipboard!');
            setMessageType('success');
        } catch (error) {
            setMessage('Failed to export tier list: ' + error.message);
            setMessageType('error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleCopyShareLink = async () => {
        setIsSharing(true);
        setMessage('');

        let link;
        try {
            link = buildShareUrl(players, getTierNames());
            setShareUrl(link.url);
        } catch (error) {
            setMessage('Failed to create share link: ' + error.message);
            setMessageType('error');
            setIsSharing(false);
            return;
        }

        const longNote = link.isLong ? ' It is long, so send it as a clickable link.' : '';

        // The link is already built and shown below, so a clipboard failure
        // (no permission, insecure context, unfocused document) is not fatal.
        try {
            await navigator.clipboard.writeText(link.url);
            setMessage('Share link copied to clipboard!' + longNote);
            setMessageType('success');
        } catch (error) {
            setMessage('Share link ready — copy it from the box below.' + longNote);
            setMessageType('success');
        } finally {
            setIsSharing(false);
        }
    };

    const handleImportCodeChange = (e) => {
        const code = e.target.value.trim();
        setImportCode(code);
        setMessage('');
        setImportInfo(null);

        if (code.length > 10) {
            const info = getImportInfo(code);
            if (info) {
                setImportInfo(info);
            }
        }
    };

    const handleImport = async () => {
        if (!importCode.trim()) {
            setMessage('Please enter an import code');
            setMessageType('error');
            return;
        }

        setIsImporting(true);
        setMessage('');

        try {
            if (!validateImportCode(importCode)) {
                throw new Error('Invalid import code format');
            }

            const importedPlayers = importTierList(importCode);
            onImportPlayers(importedPlayers);

            setMessage(`Successfully imported ${importedPlayers.length} players!`);
            setMessageType('success');
            setImportCode('');
            setImportInfo(null);
        } catch (error) {
            setMessage('Import failed: ' + error.message);
            setMessageType('error');
        } finally {
            setIsImporting(false);
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setImportCode(text);

            if (text.length > 10) {
                const info = getImportInfo(text);
                if (info) {
                    setImportInfo(info);
                }
            }
        } catch (error) {
            setMessage('Failed to paste from clipboard');
            setMessageType('error');
        }
    };

    return (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Export / Import Tier List
            </h3>

            {/* Share Section */}
            <div className="mb-6">
                <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Share Your Board
                </h4>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Get a link that opens your board for anyone — no code to paste
                </p>
                <button
                    onClick={handleCopyShareLink}
                    disabled={isSharing}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isSharing
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                >
                    {isSharing ? 'Building link...' : '🔗 Copy Share Link'}
                </button>

                {shareUrl && (
                    <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        onFocus={(e) => e.target.select()}
                        className={`mt-3 w-full px-3 py-2 text-xs font-mono border rounded-md ${darkMode
                                ? 'bg-gray-700 border-gray-600 text-gray-300'
                                : 'bg-gray-50 border-gray-300 text-gray-600'
                            }`}
                    />
                )}
            </div>

            {/* Export Section */}
            <div className="mb-6">
                <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Export Your Tier List
                </h4>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Copy a backup code you can paste back in later
                </p>
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isExporting
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : darkMode
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isExporting ? 'Copying...' : '📋 Copy Tier List'}
                </button>
            </div>

            {/* Import Section */}
            <div>
                <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Import Tier List
                </h4>
                <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Paste a tier list code from someone else
                </p>

                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={importCode}
                            onChange={handleImportCodeChange}
                            placeholder="Paste tier list code here..."
                            className={`flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                }`}
                        />
                        <button
                            onClick={handlePaste}
                            className={`px-3 py-2 text-sm border rounded-md transition-colors ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            📋
                        </button>
                    </div>

                    {importInfo && (
                        <div className={`p-2 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                            📊 {importInfo.playerCount} players • Created {new Date(importInfo.timestamp).toLocaleDateString()}
                        </div>
                    )}

                    <button
                        onClick={handleImport}
                        disabled={isImporting || !importCode.trim()}
                        className={`w-full px-4 py-2 rounded-md text-sm font-medium transition-colors ${isImporting || !importCode.trim()
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : darkMode
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                    >
                        {isImporting ? 'Importing...' : '📥 Import Tier List'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`mt-4 p-3 rounded-md text-sm ${messageType === 'success'
                        ? darkMode
                            ? 'bg-green-900 text-green-200'
                            : 'bg-green-100 text-green-800'
                        : darkMode
                            ? 'bg-red-900 text-red-200'
                            : 'bg-red-100 text-red-800'
                    }`}>
                    {message}
                </div>
            )}
        </div>
    );
};

export default ExportImport; 