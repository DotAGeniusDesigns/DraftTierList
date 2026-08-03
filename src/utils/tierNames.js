export const TIER_NAMES_KEY = 'fantasy-football-tier-names';
export const TIER_NAMES_UPDATED_EVENT = 'tier-names-updated';

export const getTierNames = () => {
    try {
        return JSON.parse(localStorage.getItem(TIER_NAMES_KEY) || '{}');
    } catch {
        return {};
    }
};

export const saveTierName = (tierNumber, name) => {
    const tierNames = getTierNames();
    tierNames[tierNumber] = name;
    localStorage.setItem(TIER_NAMES_KEY, JSON.stringify(tierNames));
    window.dispatchEvent(new CustomEvent(TIER_NAMES_UPDATED_EVENT));
};

export const clearTierNames = () => {
    localStorage.removeItem(TIER_NAMES_KEY);
    window.dispatchEvent(new CustomEvent(TIER_NAMES_UPDATED_EVENT));
};

export const replaceTierNames = (nextTierNames = {}) => {
    const clean = Object.fromEntries(
        Object.entries(nextTierNames)
            .filter(([, name]) => typeof name === 'string' && name.trim())
            .map(([tier, name]) => [tier, name.trim()])
    );
    if (Object.keys(clean).length > 0) {
        localStorage.setItem(TIER_NAMES_KEY, JSON.stringify(clean));
    } else {
        localStorage.removeItem(TIER_NAMES_KEY);
    }
    window.dispatchEvent(new CustomEvent(TIER_NAMES_UPDATED_EVENT));
};

export const getTierDisplayName = (tierNumber) => {
    const tierNames = getTierNames();
    return tierNames[tierNumber] || `Tier ${tierNumber}`;
};
