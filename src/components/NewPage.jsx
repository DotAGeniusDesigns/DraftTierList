import React, { useState, useEffect } from 'react';

const NewPage = ({ darkMode }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [timeSlots, setTimeSlots] = useState([]);
    const [userName, setUserName] = useState('');
    const [showNameInput, setShowNameInput] = useState(true);
    const [isCreating, setIsCreating] = useState(true);
    const [shareLink, setShareLink] = useState('');
    const [customTimezone, setCustomTimezone] = useState('');
    const [showTimezoneInput, setShowTimezoneInput] = useState(false);
    const [userColor, setUserColor] = useState('');
    const [showColorInput, setShowColorInput] = useState(false);

    // Check if this is a shared link (has timeSlots in URL)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedSlots = urlParams.get('timeSlots');
        const sharedUserName = urlParams.get('userName');

        if (sharedSlots) {
            try {
                const decodedSlots = JSON.parse(decodeURIComponent(sharedSlots));
                // Migrate old format (names only) to new format (user objects)
                const migratedSlots = decodedSlots.map(slot => ({
                    ...slot,
                    available: slot.available.map(item =>
                        typeof item === 'string'
                            ? { name: item, color: getAutoColor(item) }
                            : item
                    )
                }));
                setTimeSlots(migratedSlots);
                setIsCreating(false);
                if (sharedUserName) {
                    setUserName(sharedUserName);
                }
            } catch (error) {
                console.error('Error parsing shared time slots:', error);
            }
        }
    }, []);

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
        const encodedSlots = encodeURIComponent(JSON.stringify(timeSlots));
        const encodedUserName = encodeURIComponent(userName);
        const link = `${baseUrl}?timeSlots=${encodedSlots}&userName=${encodedUserName}`;
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
                <div className="mb-6">
                    <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Draft Time Scheduler
                    </h1>
                    <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {isCreating ? 'Create time slots and share with your league' : 'View and select available draft times'}
                    </p>
                </div>

                {/* Timezone Display */}
                <div className={`mb-4 p-3 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            📍 Your Timezone: {getTimezone()} ({getTimezoneAbbr()})
                        </span>
                        <button
                            onClick={() => setShowTimezoneInput(!showTimezoneInput)}
                            className={`px-3 py-1 text-sm rounded-md ${darkMode
                                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                }`}
                        >
                            {showTimezoneInput ? 'Cancel' : 'Adjust'}
                        </button>
                    </div>

                    {/* Timezone Selection */}
                    {showTimezoneInput && (
                        <div className="mt-3 pt-3 border-t border-gray-400">
                            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Select Timezone:
                            </label>
                            <select
                                value={customTimezone}
                                onChange={(e) => setCustomTimezone(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                            >
                                <option value="">Auto-detect (recommended)</option>
                                {getAvailableTimezones().map(tz => (
                                    <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                                ))}
                            </select>
                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Changing timezone will affect how times are displayed for you
                            </p>
                        </div>
                    )}
                </div>

                {/* User Name Input/Display */}
                {showNameInput ? (
                    <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {userName ? 'Edit Your Name' : 'Enter Your Name'}
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                placeholder="Your name"
                                className={`flex-1 px-3 py-2 border rounded-md ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                            />
                            <button
                                onClick={() => setShowNameInput(false)}
                                className={`px-4 py-2 rounded-md font-medium ${darkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Your Name: {userName || 'Not set'}
                                </h3>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Click on any time slot to show your availability
                                </p>
                            </div>
                            <button
                                onClick={() => setShowNameInput(true)}
                                className={`px-3 py-1 text-sm rounded-md ${darkMode
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                            >
                                {userName ? 'Edit' : 'Set Name'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Color Selection */}
                {userName && (
                    <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Your Color: {userColor ? (
                                        <span
                                            className="inline-block w-6 h-6 rounded-full ml-2"
                                            style={{ backgroundColor: userColor }}
                                        ></span>
                                    ) : 'Auto-assigned'}
                                </h3>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Choose a color to represent your availability
                                </p>
                            </div>
                            <button
                                onClick={() => setShowColorInput(!showColorInput)}
                                className={`px-3 py-1 text-sm rounded-md ${darkMode
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                            >
                                {showColorInput ? 'Cancel' : 'Choose Color'}
                            </button>
                        </div>

                        {/* Color Picker */}
                        {showColorInput && (
                            <div className="mt-3 pt-3 border-t border-gray-400">
                                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Select Color:
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {getAllColors().map(color => {
                                        const isUsed = getUsedColors().has(color);
                                        const isSelected = userColor === color;
                                        return (
                                            <button
                                                key={color}
                                                onClick={() => setUserColor(color)}
                                                disabled={isUsed && !isSelected}
                                                className={`w-12 h-12 rounded-lg border-2 transition-all ${isSelected
                                                    ? 'border-white shadow-lg scale-110'
                                                    : isUsed
                                                        ? 'border-gray-400 opacity-50 cursor-not-allowed'
                                                        : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                                                    }`}
                                                style={{ backgroundColor: color }}
                                                title={isUsed && !isSelected ? 'Color already in use' : `Select color ${color}`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="mt-2 flex gap-2">
                                    <button
                                        onClick={() => setUserColor('')}
                                        className={`px-3 py-1 text-sm rounded-md ${darkMode
                                            ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                            }`}
                                    >
                                        Reset to Auto
                                    </button>
                                    <button
                                        onClick={() => setShowColorInput(false)}
                                        className={`px-3 py-1 text-sm rounded-md ${darkMode
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                            }`}
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Calendar */}
                <div className={`mb-6 rounded-lg overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {/* Calendar Header */}
                    <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <button
                            onClick={goToPreviousWeek}
                            className={`p-3 rounded-lg text-2xl font-bold transition-colors ${darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-white hover:text-blue-300'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-blue-600'
                                }`}
                        >
                            ◀
                        </button>
                        <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {getWeekRange()}
                        </h2>
                        <button
                            onClick={goToNextWeek}
                            className={`p-3 rounded-lg text-2xl font-bold transition-colors ${darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-white hover:text-blue-300'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-blue-600'
                                }`}
                        >
                            ▶
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-8 gap-px bg-gray-200">
                        {/* Time column header */}
                        <div className={`p-3 text-center text-sm font-medium ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                            Time
                        </div>

                        {/* Day headers */}
                        {calendarDays.map(day => (
                            <div key={day.toDateString()} className={`p-3 text-center text-sm font-medium ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                                <div className="font-bold">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                <div className="text-xs">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            </div>
                        ))}

                        {/* Time rows */}
                        {timeOptions.map(time => (
                            <React.Fragment key={time}>
                                {/* Time label */}
                                <div className={`p-3 text-center text-sm font-medium border-r ${darkMode ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                    {(() => {
                                        // If we have a custom timezone selected, convert the time
                                        if (customTimezone) {
                                            // Create a mock slot to convert the time
                                            const mockSlot = { time: time, timezone: 'America/Los_Angeles' }; // Default timezone for original times
                                            const convertedTime = convertTime(time, 'America/Los_Angeles', customTimezone);
                                            return convertedTime;
                                        }
                                        return time;
                                    })()}
                                </div>

                                {/* Day columns for this time */}
                                {calendarDays.map(day => {
                                    const availability = getAvailabilityForSlot(day, time);
                                    const isAvailable = isUserAvailable(day, time);
                                    const slot = timeSlots.find(s => s.date === day.toDateString() && s.time === time);

                                    return (
                                        <div
                                            key={`${day.toDateString()}-${time}`}
                                            className={`min-h-[120px] p-2 border-r border-b relative cursor-pointer transition-colors ${darkMode ? 'bg-gray-800 border-gray-600 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }`}
                                            onClick={() => toggleAvailability(day, time)}
                                        >
                                            {/* Availability indicators */}
                                            {availability.length > 0 && (
                                                <div className="absolute top-1 left-1 right-1 space-y-1">
                                                    {availability.map((user, index) => {
                                                        const color = user.color || getUserColor(user.name);
                                                        // Determine text color based on background brightness
                                                        const isLightColor = color === '#ffffff' || color === '#dcbeff' || color === '#42d4f4' || color === '#bfef45' || color === '#aaffc3' || color === '#ffe119';
                                                        const textColor = isLightColor ? 'text-gray-900' : 'text-white';
                                                        return (
                                                            <div
                                                                key={index}
                                                                className={`px-2 py-1 text-xs rounded-full ${textColor} text-center`}
                                                                style={{ backgroundColor: color }}
                                                            >
                                                                {user.name}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Click instruction */}
                                            <div className={`absolute bottom-1 left-1 right-1 text-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Click to toggle
                                            </div>
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>



                {/* Action Buttons */}
                {isCreating && timeSlots.length > 0 && (
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                        <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Share with Your League
                        </h3>
                        <div className="flex gap-3">
                            <button
                                onClick={generateShareLink}
                                className={`px-4 py-2 rounded-md font-medium ${darkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                            >
                                📤 Generate Share Link
                            </button>
                        </div>
                        {shareLink && (
                            <div className="mt-3">
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Share this link with your league:
                                </p>
                                <div className={`mt-2 p-2 rounded bg-gray-100 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <code className="text-sm break-all">{shareLink}</code>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Instructions */}
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        How to Use
                    </h3>
                    <div className={`text-sm space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {isCreating ? (
                            <>
                                <p>1. Set your name above</p>
                                <p>2. Click on any time slot to add your availability</p>
                                <p>3. Generate a share link and send to your league</p>
                                <p>4. Leaguemates can click the link to see and select available times</p>
                                <p>5. Times are automatically converted to each user's local timezone</p>
                            </>
                        ) : (
                            <>
                                <p>1. Set your name above</p>
                                <p>2. Click on any time slot to show your availability</p>
                                <p>3. See who else is available for each time</p>
                                <p>4. Times show both original and your local timezone</p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewPage;
