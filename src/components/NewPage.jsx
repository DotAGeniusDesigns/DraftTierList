import React from 'react';

const NewPage = ({ darkMode }) => {
    return (
        <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
                <div className="mb-6 text-center">
                    <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        🚧 Coming Soon
                    </h1>
                    <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Draft Time Scheduler
                    </p>
                    <p className={`text-lg mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        We're building something awesome for coordinating your fantasy football draft times.
                    </p>
                    <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                        Check back soon for the full feature!
                    </p>
                </div>

                <div className={`text-center py-16 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <div className="mb-8">
                        <div className={`text-8xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}>
                            🏈
                        </div>
                        <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Fantasy Football Draft Coordination
                        </h2>
                        <p className="text-lg max-w-2xl mx-auto">
                            We're building a powerful tool to help commissioners coordinate draft times across multiple timezones.
                            League members will be able to easily select their availability from predefined options.
                        </p>
                    </div>

                    <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                        <h3 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Planned Features
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-3xl mx-auto">
                            <div className="flex items-start gap-3">
                                <span className="text-green-500 text-xl">✓</span>
                                <div>
                                    <h4 className="font-medium">Commissioner Control</h4>
                                    <p className="text-sm opacity-75">Set available time slots for your league</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-green-500 text-xl">✓</span>
                                <div>
                                    <h4 className="font-medium">Multiple Choice Selection</h4>
                                    <p className="text-sm opacity-75">Members choose from available options</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-green-500 text-xl">✓</span>
                                <div>
                                    <h4 className="font-medium">Timezone Support</h4>
                                    <p className="text-sm opacity-75">Automatic conversion for global leagues</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-green-500 text-xl">✓</span>
                                <div>
                                    <h4 className="font-medium">Response Reports</h4>
                                    <p className="text-sm opacity-75">Organized view of all availability</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewPage;
