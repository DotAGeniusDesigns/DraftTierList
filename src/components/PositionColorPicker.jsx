import React from 'react';
import { ui } from '../utils/uiTheme';
import { usePositionColors } from '../context/PositionColorsContext';
import { POSITIONS, POSITION_COLOR_PRESETS } from '../utils/positionColors';

/**
 * `controller` lets a page point the picker at a different set of colors than the
 * board's — the Draft Kit passes its own when it has been unlinked. Omitted, it
 * edits the board, which is what every existing caller wants.
 * `subtitle` and `children` are for a caller that needs to explain or qualify
 * what the swatches are about to change.
 */
const PositionColorPicker = ({ darkMode, onClose, controller, subtitle, children }) => {
    const board = usePositionColors();
    const { colors, setColor, resetColors } = controller || board;

    return (
        <div className={ui.modalOverlay} onClick={onClose}>
            <div
                className={`max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border p-6 shadow-2xl ${darkMode ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-white'}`}
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between">
                    <div>
                        <h3 className={`text-lg font-bold ${ui.heading(darkMode)}`}>Position Colors</h3>
                        <p className={`mt-1 text-sm ${ui.muted(darkMode)}`}>
                            {subtitle || 'Pick an accent color for each position.'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${darkMode ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
                        aria-label="Close"
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path fillRule="evenodd" d="M4.28 4.28a.75.75 0 011.06 0L10 8.94l4.66-4.66a.75.75 0 111.06 1.06L11.06 10l4.66 4.66a.75.75 0 11-1.06 1.06L10 11.06l-4.66 4.66a.75.75 0 01-1.06-1.06L8.94 10 4.28 5.34a.75.75 0 010-1.06z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {children}

                <div className="space-y-5 pr-1">
                    {POSITIONS.map((position) => (
                        <div key={position}>
                            <div className="mb-2 flex items-center gap-2">
                                <span
                                    className="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/10"
                                    style={{ backgroundColor: colors[position] }}
                                />
                                <span className={`text-sm font-semibold ${ui.heading(darkMode)}`}>{position}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {POSITION_COLOR_PRESETS.map((preset) => {
                                    const active = colors[position]?.toLowerCase() === preset.hex.toLowerCase();
                                    return (
                                        <button
                                            key={preset.hex}
                                            type="button"
                                            onClick={() => setColor(position, preset.hex)}
                                            title={preset.name}
                                            aria-label={`Set ${position} to ${preset.name}`}
                                            aria-pressed={active}
                                            className="h-7 w-7 shrink-0 rounded-full transition hover:scale-110"
                                            style={{
                                                backgroundColor: preset.hex,
                                                boxShadow: active
                                                    ? `0 0 0 2px ${darkMode ? '#0f172a' : '#ffffff'}, 0 0 0 4px ${preset.hex}`
                                                    : 'none',
                                            }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <div className={`mt-6 flex items-center justify-between gap-3 border-t pt-4 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                    <button
                        onClick={resetColors}
                        className={`text-sm font-medium ${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Reset to defaults
                    </button>
                    <button onClick={onClose} className={ui.btnPrimary()}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PositionColorPicker;
