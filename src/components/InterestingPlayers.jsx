import React from 'react';
import ComingSoonPage from './ComingSoonPage';

const InterestingPlayers = ({ darkMode }) => (
    <ComingSoonPage
        darkMode={darkMode}
        title="Interesting Players"
        subtitle="Waiver wire watch list — coming soon for 2026."
        description="We're putting together a weekly watch list of emerging players, injury replacements, and deep-league stashes worth monitoring."
        icon="⭐"
        features={[
            { title: 'Waiver Targets', detail: 'Players trending toward more opportunity' },
            { title: 'Usage Notes', detail: 'Snap, target, and carry context at a glance' },
            { title: 'Weekly Updates', detail: 'Refreshed as the NFL week unfolds' },
            { title: 'Deep League Value', detail: 'Names worth stashing before they break out' },
        ]}
    />
);

export default InterestingPlayers;
