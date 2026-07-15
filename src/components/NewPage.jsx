import React from 'react';
import ComingSoonPage from './ComingSoonPage';

const NewPage = ({ darkMode }) => (
    <ComingSoonPage
        darkMode={darkMode}
        title="Draft Time Scheduler"
        subtitle="We're building something awesome for coordinating your fantasy football draft times."
        description="A powerful tool to help commissioners coordinate draft times across multiple timezones. League members will be able to easily select their availability from predefined options."
        icon="🏈"
        features={[
            { title: 'Commissioner Control', detail: 'Set available time slots for your league' },
            { title: 'Multiple Choice Selection', detail: 'Members choose from available options' },
            { title: 'Timezone Support', detail: 'Automatic conversion for global leagues' },
            { title: 'Response Reports', detail: 'Organized view of all availability' },
        ]}
    />
);

export default NewPage;
