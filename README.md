# NathanType

A modern, feature-rich typing test application inspired by Monkeytype, built with React, TypeScript, and Tailwind CSS.

![NathanType](https://img.shields.io/badge/NathanType-v1.0-yellow)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Core Features (Monkeytype Parity)

#### Test Modes
- **Time Mode**: 15, 30, 60, 120 seconds (customizable)
- **Words Mode**: 10, 25, 50, 100 words (customizable)
- **Quote Mode**: Random quotes from a curated database
- **Zen Mode**: Freeform typing (coming soon)

#### Real-Time Statistics
- **WPM (Words Per Minute)**: Standard calculation (characters/5 per minute)
- **Raw WPM**: Includes incorrect words
- **Accuracy**: Percentage of correct characters
- **Consistency**: Based on WPM variance over time
- **Character Breakdown**: Correct, incorrect, extra, and missed characters

#### Test Options
- **Punctuation Toggle**: Include punctuation marks
- **Numbers Toggle**: Mix numbers into the test
- **Difficulty Modes**:
  - Normal: Standard typing experience
  - Expert: Fails on incorrect word submission
  - Master: Fails on any incorrect keystroke (100% accuracy required)

#### Visual Customization
- **10+ Themes**: Including Serika Dark, Dracula, Nord, Monokai, Gruvbox, Tokyo Night, and more
- **Font Sizes**: Small, medium, large, extra-large
- **Caret Styles**: Line, block, underline, or off
- **Caret Speed**: Adjustable blinking speed
- **Smooth Caret**: Animated cursor movement
- **Live WPM Display**: Show current speed while typing

#### Test Behavior Settings
- **Quick Restart**: Tab + Enter to restart
- **Blind Mode**: Hide error highlighting
- **Focus Mode**: Dim everything except typing area
- **Stop on Error**: Prevent incorrect character input
- **Confidence Mode**: Disable backspace (coming soon)

#### Results Display
- **WPM Graph**: Line chart showing WPM over time
- **Detailed Statistics**: Character breakdown, accuracy, consistency
- **Test Info**: Mode, language, and configuration details

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nathantype.git
cd nathantype

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: Zustand (lightweight, simple)
- **Build Tool**: Vite
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library (coming soon)

## Project Structure

```
nathantype/
├── src/
│   ├── components/
│   │   ├── TypingArea/       # Core typing interface
│   │   ├── ModeSelector/     # Test mode selection
│   │   ├── Results/          # Results display and charts
│   │   └── Settings/         # Settings modal
│   ├── hooks/
│   │   └── useTypingTest.ts  # Core typing logic
│   ├── stores/
│   │   ├── settingsStore.ts  # User settings
│   │   ├── testStore.ts      # Test state
│   │   └── userStore.ts      # User profile (future)
│   ├── utils/
│   │   ├── calculateStats.ts # WPM and accuracy calculations
│   │   ├── wordGenerator.ts  # Word list generation
│   │   └── themes.ts         # Theme utilities
│   ├── data/
│   │   ├── words/            # Word lists and quotes
│   │   └── themes/           # Theme definitions
│   └── types/
│       └── index.ts          # TypeScript types
├── public/                   # Static assets
└── package.json
```

## Usage

### Basic Typing Test
1. Select a test mode (time or words)
2. Choose your preferred duration/word count
3. Optionally enable punctuation or numbers
4. Click in the typing area or start typing to begin
5. Type the words as they appear
6. View your results when the test completes

### Keyboard Shortcuts
- **Tab + Enter**: Quick restart (if enabled in settings)
- **Escape**: Stop current test (coming soon)

### Settings
Click the Settings button in the header to customize:
- **Theme**: Choose from 10+ color schemes
- **Font Size**: Adjust text size
- **Caret Style**: Change cursor appearance
- **Difficulty**: Set challenge level
- **Behavior Options**: Enable/disable various features

## Features Roadmap

### Phase 1: Core MVP ✅
- [x] Basic typing test with time mode
- [x] Real-time WPM and accuracy
- [x] Results display
- [x] Multiple themes
- [x] Settings persistence

### Phase 2: Enhanced Features (In Progress)
- [ ] Quote mode improvements
- [ ] Zen mode implementation
- [ ] Custom text mode
- [ ] Sound effects
- [ ] Virtual keyboard display
- [ ] Improved live WPM calculation

### Phase 3: Advanced Features
- [ ] Account system with history
- [ ] Personal best tracking
- [ ] Test replay functionality
- [ ] Leaderboards
- [ ] Social features (friends, challenges)
- [ ] Multiplayer racing
- [ ] Code typing mode
- [ ] AI-powered practice mode

### Phase 4: Polish & Scale
- [ ] Advanced analytics dashboard
- [ ] Gamification (XP, achievements)
- [ ] Mobile optimization
- [ ] PWA support
- [ ] Accessibility improvements

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Calculations & Algorithms

### WPM Calculation
```
WPM = (correct_characters / 5) / (time_in_minutes)
```
Only characters in correctly typed words are counted.

### Raw WPM Calculation
```
Raw WPM = (all_typed_characters / 5) / (time_in_minutes)
```
All typed characters are counted, regardless of correctness.

### Accuracy Calculation
```
Accuracy = (correct_characters / total_characters) * 100
```

### Consistency Calculation
Based on the coefficient of variation of WPM over time:
```
CV = standard_deviation(WPM_values) / mean(WPM_values)
Consistency = max(0, 100 - CV * 333)
```

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Inspired by [Monkeytype](https://monkeytype.com) - an amazing typing test platform
- Built with React, TypeScript, and Tailwind CSS
- Chart visualization powered by Recharts

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Built with ❤️ by Nathan** • [GitHub](https://github.com/yourusername) • [Portfolio](https://yourportfolio.com)
