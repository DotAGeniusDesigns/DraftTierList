export const SCORING_FORMATS = {
    standard: {
        id: 'standard',
        label: 'Standard',
        shortLabel: 'Standard',
        enabled: true,
    },
    'half-ppr': {
        id: 'half-ppr',
        label: '0.5 PPR',
        shortLabel: '0.5 PPR',
        enabled: true,
    },
    ppr: {
        id: 'ppr',
        label: 'PPR',
        shortLabel: 'PPR',
        enabled: true,
    },
    'superflex-ppr': {
        id: 'superflex-ppr',
        label: 'Superflex PPR',
        shortLabel: 'SF PPR',
        enabled: true,
    },
};

export const DEFAULT_SCORING_FORMAT = 'half-ppr';

export const SCORING_FORMAT_OPTIONS = Object.values(SCORING_FORMATS);

export const getScoringFormatLabel = (formatId) => (
    SCORING_FORMATS[formatId]?.shortLabel || SCORING_FORMATS[DEFAULT_SCORING_FORMAT].shortLabel
);

export const normalizeScoringFormat = (formatId) => (
    SCORING_FORMATS[formatId] ? formatId : DEFAULT_SCORING_FORMAT
);
