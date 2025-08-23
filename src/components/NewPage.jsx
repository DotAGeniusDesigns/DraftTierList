import React, { useState, useEffect } from 'react';

const NewPage = ({ darkMode }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timeSlots, setTimeSlots] = useState([]);
    const [userName, setUserName] = useState('');
    const [showNameInput, setShowNameInput] = useState(true);
    const [isCreator, setIsCreator] = useState(true);
    const [shareLink, setShareLink] = useState('');
    const [customTimezone, setCustomTimezone] = useState('');
    const [showTimezoneInput, setShowTimezoneInput] = useState(false);
    const [userColor, setUserColor] = useState('');
    const [showColorInput, setShowColorInput] = useState(false);
    const [sessionId, setSessionId] = useState('');
    const [allResponses, setAllResponses] = useState([]);
    const [showCommissionerView, setShowCommissionerView] = useState(false);

    // Check if this is a shared link (has session ID in URL)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const urlSessionId = urlParams.get('session');

        if (urlSessionId) {
            setSessionId(urlSessionId);
            setIsCreator(false);

            // Load existing responses for this session
            const existingResponses = JSON.parse(localStorage.getItem(`draft-responses-${urlSessionId}`) || '[]');
            setAllResponses(existingResponses);

            // Load the commissioner's available time slots
            const commissionerSlots = localStorage.getItem(`draft-commissioner-slots-${urlSessionId}`);
            if (commissionerSlots) {
                try {
                    const { timeSlots: availableSlots } = JSON.parse(commissionerSlots);
                    setTimeSlots(availableSlots);
                } catch (error) {
                    console.error('Error loading commissioner slots:', error);
                }
            }

            // Check if this user has already responded
            const userResponse = existingResponses.find(r => r.userName === userName);
            if (userResponse) {
                // Load their previous selections
                setTimeSlots(prevSlots =>
                    prevSlots.map(slot => ({
                        ...slot,
                        available: userResponse.selectedSlots.some(selectedSlot =>
                            selectedSlot.date === slot.date && selectedSlot.time === slot.time
                        ) ? [{ name: userName, color: userResponse.userColor }] : []
                    }))
                );
                setUserColor(userResponse.userColor);
            }
        } else {
            // This is the creator - generate a new session ID
            const newSessionId = Math.random().toString(36).substring(2, 8);
            setSessionId(newSessionId);
            setIsCreator(true);
        }
    }, [userName]);

    // Get timezone
    const getTimezone = () => {
        return customTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    };

    // Get timezone abbreviation
    const getTimezoneAbbr = () => {
        const date = new Date();
        const timeZoneName = Intl.DateTimeFormat('en', { timeZoneName: 'short' }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value;
        return timeZoneName || getTimezone().split('/').pop().substring(0, 3).toUpperCase();
    };

    // Get available timezones for selection
    const getAvailableTimezones = () => {
        return [
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'America/Phoenix',
            'America/Anchorage',
            'Pacific/Honolulu',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'Asia/Tokyo',
            'Asia/Shanghai',
            'Australia/Sydney'
        ];
    };

    // Convert time from one timezone to another
    const convertTime = (time, fromTimezone, toTimezone) => {
        try {
            // Parse the time (e.g., "10:00 AM")
            const [timeStr, period] = time.split(' ');
            const [hours, minutes] = timeStr.split(':').map(Number);

            // Create a date object in the from timezone
            const date = new Date();
            date.setHours(period === 'PM' && hours !== 12 ? hours + 12 : hours === 12 && period === 'AM' ? 0 : hours, minutes, 0, 0);

            // Convert to the target timezone
            const options = {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: toTimezone
            };

            return new Intl.DateTimeFormat('en-US', options).format(date);
        } catch (error) {
            console.error('Error converting time:', error);
            return time; // Fallback to original time
        }
    };

    // Generate calendar days for the selected week
    const getCalendarDays = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const day = selectedDate.getDate();

        // Get the start of the week (Sunday)
        const startOfWeek = new Date(year, month, day);
        startOfWeek.setDate(day - startOfWeek.getDay());

        const days = [];

        // Add 7 days starting from Sunday
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            days.push(date);
        }

        return days;
    };

    // Get week range display
    const getWeekRange = () => {
        const days = getCalendarDays();
        const startDate = days[0];
        const endDate = days[6];

        const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });

        if (startMonth === endMonth) {
            return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${startDate.getFullYear()}`;
        } else {
            return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${startDate.getFullYear()}`;
        }
    };

    // Navigate to previous week
    const goToPreviousWeek = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 7);
        setSelectedDate(newDate);
    };

    // Navigate to next week
    const goToNextWeek = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 7);
        setSelectedDate(newDate);
    };

    // Save commissioner's available time slots
    const saveCommissionerSlots = () => {
        if (timeSlots.length === 0) {
            alert('Please select at least one time slot before generating the link.');
            return;
        }

        // Save the commissioner's selected slots
        localStorage.setItem(`draft-commissioner-slots-${sessionId}`, JSON.stringify({
            timeSlots,
            createdBy: userName,
            createdAt: new Date().toISOString()
        }));

        alert('Time slots saved! Now generate and share the link with your league.');
    };

    // Submit response for this session
    const submitResponse = () => {
        if (!userName.trim() || timeSlots.length === 0) {
            alert('Please set your name and select at least one time slot before submitting.');
            return;
        }

        const response = {
            userName,
            userColor: userColor || getAutoColor(userName),
            selectedSlots: timeSlots, // Rename to be clearer
            submittedAt: new Date().toISOString(),
            timezone: getTimezone()
        };

        // Get existing responses
        const existingResponses = JSON.parse(localStorage.getItem(`draft-responses-${sessionId}`) || '[]');

        // Remove any existing response from this user
        const filteredResponses = existingResponses.filter(r => r.userName !== userName);

        // Add new response
        const updatedResponses = [...filteredResponses, response];

        // Save to localStorage
        localStorage.setItem(`draft-responses-${sessionId}`, JSON.stringify(updatedResponses));

        alert('Response submitted successfully! The commissioner will see your availability.');
    };

    // Toggle user availability for a specific date and time
    const toggleAvailability = (date, time) => {
        if (!userName.trim()) {
            setShowNameInput(true);
            return;
        }

        const dateStr = date.toDateString();
        let slot = timeSlots.find(s => s.date === dateStr && s.time === time);

        if (!slot) {
            // Create new slot if it doesn't exist
            const newSlot = {
                id: Date.now() + Math.random(),
                date: dateStr,
                time: time,
                timezone: getTimezone(), // Store the creator's timezone
                available: [{ name: userName, color: userColor || getUserColor(userName) }] // Add user with color
            };
            setTimeSlots(prevSlots => [...prevSlots, newSlot]);
        } else {
            // Toggle existing slot
            const isAvailable = slot.available.some(user => user.name === userName);
            if (isAvailable) {
                // Remove user from available list
                setTimeSlots(prevSlots => prevSlots.map(s =>
                    s.id === slot.id
                        ? { ...s, available: s.available.filter(user => user.name !== userName) }
                        : s
                ));
            } else {
                // Add user to available list
                setTimeSlots(prevSlots => prevSlots.map(s =>
                    s.id === slot.id
                        ? { ...s, available: [...s.available, { name: userName, color: userColor || getUserColor(userName) }] }
                        : s
                ));
            }
        }
    };

    // Generate share link
    const generateShareLink = () => {
        const baseUrl = window.location.origin + window.location.pathname;
        const link = `${baseUrl}?session=${sessionId}`;
        setShareLink(link);

        // Copy to clipboard
        navigator.clipboard.writeText(link).then(() => {
            alert('Share link copied to clipboard!');
        });
    };

    // Time options for time slots (2-hour increments covering full 24-hour period)
    const timeOptions = [
        '12:00 AM', '2:00 AM', '4:00 AM', '6:00 AM', '8:00 AM', '10:00 AM',
        '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM', '10:00 PM'
    ];

    // Get availability for a specific date and time
    const getAvailabilityForSlot = (date, time) => {
        const dateStr = date.toDateString();
        const slot = timeSlots.find(s => s.date === dateStr && s.time === time);
        return slot ? slot.available : [];
    };

    // Check if user is available for a specific slot
    const isUserAvailable = (date, time) => {
        const availability = getAvailabilityForSlot(date, time);
        return availability.some(user => user.name === userName);
    };

    // Get all available colors
    const getAllColors = () => {
        return [
            '#ffffff', '#f032e6', '#911eb4', '#dcbeff', '#4363d8', '#000075',
            '#469990', '#42d4f4', '#bfef45', '#aaffc3', '#ffe119', '#808000',
            '#9A6324', '#f58231', '#e6194B', '#800000'
        ];
    };

    // Get colors that are already in use by other users
    const getUsedColors = () => {
        const usedColors = new Set();
        timeSlots.forEach(slot => {
            slot.available.forEach(user => {
                if (user.name !== userName) {
                    usedColors.add(user.color);
                }
            });
        });
        return usedColors;
    };

    // Get auto-assigned color for a name
    const getAutoColor = (name) => {
        const colors = getAllColors();
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    // Get user color (either selected or auto-assigned)
    const getUserColor = (name) => {
        // If this is the current user and they have a selected color, use it
        if (name === userName && userColor) {
            return userColor;
        }

        // For other users, try to find their color in time slots
        for (const slot of timeSlots) {
            const user = slot.available.find(u => u.name === name);
            if (user && user.color) {
                return user.color;
            }
        }

        // Fallback to auto-assigned color
        return getAutoColor(name);
    };

    // Get time display for a slot (with timezone conversion)
    const getTimeDisplay = (slot) => {
        if (!slot.timezone) {
            return slot.time; // Fallback for old slots without timezone
        }

        const currentTimezone = getTimezone();
        if (slot.timezone === currentTimezone) {
            return slot.time; // Same timezone, no conversion needed
        }

        // Convert to current user's timezone
        const convertedTime = convertTime(slot.time, slot.timezone, currentTimezone);
        const originalTimezoneAbbr = slot.timezone.split('/').pop().substring(0, 3).toUpperCase();
        const currentTimezoneAbbr = getTimezoneAbbr();

        return `${slot.time} ${originalTimezoneAbbr} (${convertedTime} ${currentTimezoneAbbr})`;
    };

    // Get converted time for display in current timezone
    const getConvertedTime = (slot) => {
        if (!slot.timezone) {
            return slot.time; // Fallback for old slots without timezone
        }

        const currentTimezone = getTimezone();
        if (slot.timezone === currentTimezone) {
            return slot.time; // Same timezone, no conversion needed
        }

        // Convert to current user's timezone
        return convertTime(slot.time, slot.timezone, currentTimezone);
    };

    const calendarDays = getCalendarDays();

    return (
        <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
                {/* Header */}
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

                {/* Coming Soon Content */}
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
