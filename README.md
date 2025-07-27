# Fantasy Football Draft Tier List

A modern, interactive React application for organizing fantasy football draft rankings with drag-and-drop functionality and draft tracking.

## Features

### Core Functionality
- **Draggable Tier List**: Players can be dragged between tiers and reordered within tiers
- **Draft Status Tracking**: Click players to mark as drafted with visual indicators
- **Local Storage Persistence**: All data automatically saves to browser storage
- **Add/Remove Players**: Add new players with position and team information
- **Tier Management**: Remove empty tiers and reorganize as needed

### UI/UX Features
- **Modern Design**: Clean, responsive interface using Tailwind CSS
- **Visual Feedback**: Hover states, drag indicators, and smooth animations
- **Color-Coded Tiers**: Each tier has a distinct color for easy identification
- **Statistics Dashboard**: Real-time counts of total, drafted, and available players
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices

### Sample Data
The application comes pre-loaded with popular fantasy football players organized in tiers:
- **Tier 1**: Saquon Barkley, Ja'Marr Chase, Justin Jefferson, Jahmyr Gibbs, CeeDee Lamb
- **Tier 2**: Puka Nacua, Amon-Ra St. Brown, Tyreek Hill, Josh Allen, Lamar Jackson
- **Tier 3**: Christian McCaffrey, Austin Ekeler, Derrick Henry, Stefon Diggs, AJ Brown
- **Tier 4**: Patrick Mahomes, Jalen Hurts, Joe Burrow, Travis Kelce, Mark Andrews

## Tech Stack

- **React 18** - Modern React with functional components and hooks
- **react-beautiful-dnd** - Smooth drag and drop functionality
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Local Storage** - Browser-based data persistence
- **HTML5 Drag and Drop API** - Native drag and drop support

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd fantasy-football-draft-tier-list
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to view the application

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## How to Use

### Basic Operations
1. **Drag and Drop**: Click and drag players between tiers or reorder within the same tier
2. **Mark as Drafted**: Click on any player card to toggle their draft status
3. **Add Players**: Use the "Add Player" button to add new players to your list
4. **Remove Tiers**: Empty tiers can be removed using the X button in the tier header

### Data Management
- **Automatic Saving**: All changes are automatically saved to your browser's local storage
- **Reset Data**: Use the "Reset All" button to restore the original sample data
- **Clear Drafted**: Use "Clear Drafted" to remove all draft status indicators

### Keyboard Shortcuts
- **Enter**: Submit the add player form
- **Escape**: Cancel the add player form

## File Structure

```
src/
├── components/
│   ├── TierList.jsx      # Main tier list component
│   ├── Tier.jsx          # Individual tier component
│   └── Player.jsx        # Player card component
├── hooks/
│   └── useLocalStorage.js # Custom hook for localStorage
├── utils/
│   └── playerData.js     # Initial data and helper functions
├── App.jsx               # Main application component
├── index.js              # Application entry point
└── index.css             # Global styles and Tailwind imports
```

## Customization

### Adding More Players
Edit `src/utils/playerData.js` to add more initial players:

```javascript
{
  id: 'player-id',
  name: 'Player Name',
  position: 'RB', // QB, RB, WR, TE, K, DEF
  team: 'KC',
  tier: 1,
  drafted: false
}
```

### Styling
- Modify `tailwind.config.js` to customize colors and theme
- Edit `src/index.css` for custom CSS styles
- Update tier colors in `src/utils/playerData.js`

### Features
- Add export/import functionality for sharing lists
- Implement undo/redo functionality
- Add player search and filtering
- Create multiple draft lists for different leagues

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Local Storage

The application uses browser local storage to persist data. Data is stored under the key `fantasy-football-players` and includes:
- Player information (name, position, team)
- Tier assignments
- Draft status
- Custom added players

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues or questions, please create an issue in the repository or contact the maintainers. 