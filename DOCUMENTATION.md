# 🎲 Simply Dice - Game Documentation

A premium **Dots & Boxes** style dice game built with React + TypeScript + Vite.

---

## 📋 Overview

**Simply Dice** is a modern, mobile-first board game where players roll dice and draw lines to complete boxes. Features both **Player vs Player (PvP)** and **Player vs AI** modes with stunning chalkboard-style visuals.

---

## 🎮 Game Modes

| Mode | Description |
|------|-------------|
| **PvP** | Two players take turns on the same device |
| **AI** | Play against an intelligent computer opponent |

## 🎯 Board Types

| Board | Description |
|-------|-------------|
| **Square** | Classic grid-based dots & boxes (5x5 to custom sizes) |
| **Triangle** | Unique triangular grid with 6 rows |

---

## 📁 Project Structure

```
simply-dice/
├── App.tsx                    # Main app logic & screen routing
├── index.html                 # Entry HTML
├── index.tsx                  # React entry point
├── vite.config.ts             # Vite configuration
├── package.json               # Dependencies
│
├── components/
│   ├── IntroScreen.tsx        # Animated splash/intro screen
│   ├── HomeScreen.tsx         # Main menu with game mode selection
│   ├── BoardSelectScreen.tsx  # Board type & size selection
│   ├── BoardGame.tsx          # Core game logic (677 lines)
│   ├── Dice.tsx               # 3D dice component
│   ├── DailySpinnerScreen.tsx # Daily reward spinner
│   ├── AdGateScreen.tsx       # Ad-based chance system
│   ├── AuthScreen.tsx         # Authentication (unused/optional)
│   └── BearLogo.tsx           # Animated bear logo
│
├── services/
│   └── firebase.ts            # Firebase analytics & crash reporting
│
├── styles/
│   └── ThemeContext.tsx       # Theme provider (dark mode)
│
└── utils/
    ├── MusicManager.ts        # Background music control
    ├── SoundManager.ts        # Sound effects (dice, clicks)
    ├── dailySpin.ts           # Daily spin logic
    └── gameChances.ts         # Game attempts/chances system
```

---

## 🔧 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.3 | UI Framework |
| **TypeScript** | 5.8.2 | Type Safety |
| **Vite** | 6.2.0 | Build Tool |
| **Firebase** | 12.8.0 | Analytics & Crash Reporting |

---

## 🎲 Game Flow

```
┌─────────────┐
│  IntroScreen │
└──────┬──────┘
       ▼
┌──────────────────┐
│ Daily Spinner?   │──Yes──▶ DailySpinnerScreen
└───────┬──────────┘                │
        │ No                        │
        ▼                           ▼
┌─────────────┐              ┌─────────────┐
│  HomeScreen │◀─────────────│             │
└──────┬──────┘              └─────────────┘
       │
       ▼ Select Mode (PvP/AI)
┌──────────────────┐
│ BoardSelectScreen│
└───────┬──────────┘
        │
        ▼ Check Chances
   ┌────────────┐
   │ Chances > 0?│──No──▶ AdGateScreen ──▶ Watch Ad
   └─────┬──────┘                              │
         │ Yes                                 │
         ▼                                     ▼
┌─────────────┐◀───────────────────────────────┘
│  BoardGame  │
└─────────────┘
```

---

## ✨ Key Features

### 🎯 Gameplay
- **Dice Rolling** - Animated 3D dice with realistic physics
- **Line Drawing** - Click/tap to claim lines between dots
- **Box Completion** - Complete a box to score and get another turn
- **AI Opponent** - Smart AI that can simulate moves and prioritize winning

### 💰 Monetization
- **Daily Spin** - Free chances via daily reward wheel
- **Ad Gate** - Watch rewarded ads for extra game attempts
- **Chance System** - Limited plays per day unless watching ads

### 🎨 Visual Design
- **Chalkboard Aesthetic** - Hand-drawn, educational feel
- **Glassmorphism** - Modern backdrop blur effects
- **Animations** - Smooth transitions and micro-interactions
- **Offline Detection** - Beautiful offline overlay with retry status

### 🔊 Audio
- **Background Music** - Ambient music (stops during gameplay)
- **Sound Effects** - Dice rolls, clicks, completions
- **Mute Toggle** - User-controlled audio settings

### 📊 Analytics
- **Firebase Events** - Session tracking, screen views, game completions
- **Crash Reporting** - Global error handling with Crashlytics
- **Network Status** - Online/offline event logging

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Set up environment
# Add your GEMINI_API_KEY to .env.local

# Start development server
npm run dev
```

---

## 📱 Mobile Features

- **Touch Optimized** - Large tap targets for mobile play
- **Responsive Design** - Works on all screen sizes
- **PWA Ready** - Can be installed as mobile app
- **AdMob Integration** - Ready for rewarded video ads

---

## 🎮 Game Mechanics

### Dice Roll Phase
1. Current player rolls the dice
2. Dice shows value 1-6
3. Player gets that many moves

### Move Phase
1. Player clicks on empty lines between dots
2. Each line claimed uses one move
3. Completing a box scores 1 point and grants bonus moves

### Win Condition
- Game ends when all boxes are completed
- Player with most boxes wins
- Ties are possible

---

## 🔧 Configuration

| Setting | Location | Description |
|---------|----------|-------------|
| `ADMOB_APP_ID` | `App.tsx` | AdMob application ID |
| `TRI_ROWS` | `BoardGame.tsx` | Triangle grid rows (default: 6) |
| `gridSize` | `App.tsx` | Square board size (default: 5) |

---

## 📄 License

Built with ❤️ using React + Vite
