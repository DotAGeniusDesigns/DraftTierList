import React from 'react';
import ComingSoonPage from './ComingSoonPage';

const Streamers = ({ darkMode }) => (
    <ComingSoonPage
        darkMode={darkMode}
        title="Weekly Streamers"
        subtitle="QB, TE, DST, and K streaming picks — coming back for 2026."
        description="We're rebuilding the streamers tool for the new season with updated weekly rankings, opponent stats, and rostered-percent context."
        icon="⚡"
        features={[
            { title: 'Weekly Rankings', detail: 'Curated streaming options by position' },
            { title: 'Matchup Context', detail: 'Opponent defensive stats and trends' },
            { title: 'Ownership Signals', detail: 'See who is widely available on waivers' },
            { title: 'Season Updates', detail: 'Fresh data each NFL week' },
        ]}
    />
);

export default Streamers;
