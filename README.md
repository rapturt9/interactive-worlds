# Interactive Worlds

An immersive text-based adventure platform with persistent worlds, dynamic storytelling, and AI-powered game masters.

## Features (MVP - Phase 1)

 **Story Module**

- Comprehensive world generation with hidden plots, conspiracies, and traps
- Story bible system that updates dynamically
- Spoiler tags for hidden information
- Reference classes for realistic progression
- No plot armor - realistic stakes and consequences

 **Chat Interface**

- Clean, responsive UI with markdown support
- Collapsible spoiler blocks for hidden information
- Edit previous messages to explore different paths
- Real-time streaming responses

 **Dual Model Architecture**

- **Free Tier**: Gemini 2.0 Flash + Claude 3.5 Haiku
- **Pro Tier**: Gemini Exp 1206 + Claude Sonnet 4
- Prompt caching for cost efficiency and speed

 **World Customization**

- Specify world type (cultivation fantasy, space opera, etc.)
- Custom power systems
- Starting social class
- Additional custom instructions

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenRouter API key (get one at [openrouter.ai](https://openrouter.ai))

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd interactive-worlds
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenRouter API key:

```
OPENROUTER_API_KEY=your_key_here
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### Creating a New World

1. Choose your model tier (Free or Pro)
2. Optionally customize:
   - World Type (e.g., "Cultivation Fantasy", "Space Opera")
   - Power System (e.g., "Qi Cultivation", "Magic Circles")
   - Starting Social Class (e.g., "Peasant", "Noble")
   - Custom Instructions for world generation
3. Click "Generate World & Start Adventure"
4. Wait for the AI to create your unique world with hidden plots and conspiracies

### Playing the Adventure

- Read the game master's descriptions carefully
- Choose your actions wisely - some opportunities are traps!
- Click on "Hidden Information (Spoiler)" blocks to reveal secret plots
- Edit previous messages to explore different choices
- Remember: NPCs may have hidden agendas, and trust is dangerous

### Understanding the Game

**Core Principles:**

- **Predetermined World**: Everything exists before you interact with it
- **Realistic Stakes**: Death, disease, and accidents can happen
- **No Plot Armor**: Success is not guaranteed
- **Active Conspiracies**: Multiple plots run in the background
- **Economic Realism**: Prices and resources are mathematically consistent

**Story Bible:**
The game maintains a hidden "story bible" containing:

- World foundation (power systems, economy, politics)
- Predetermined elements (locations, NPCs, opportunities)
- Your character status
- Timeline of events
- Hidden plots and traps

## Model Costs (Approximate)

### Free Tier

- ~$0.10-0.30 per 100-300 turn adventure
- Faster responses with Gemini Flash
- Good quality with Claude Haiku

### Pro Tier

- ~$2-5 per 100-300 turn adventure
- Best storytelling with Claude Sonnet 4
- Better world consistency with Gemini Pro

## Roadmap

### Phase 2: Summarization Module (Coming Soon)

- Automatic conversation summarization
- Infinite context management
- Gemini updates full bible in background
- Never lose progress

### Phase 3: Randomization Module

- LLM-executed dice rolls
- Math calculations for resources
- Probability-based events

### Phase 4: Status Card Module

- Real-time character stats display
- Automatic updates from story events
- Resource tracking with calculations

### Phase 5+

- Learning module (real-world skills teaching)
- Entity module (relationship graphs)
- RAG module (infinite memory)
- World consistency (seed-based generation)
- Map generation (visual world maps)
- Storybook module (journey review)
- Place in story (play in existing fictional worlds)
- Tournament module (compete with others)
- Mobile app

## Technologies Used

- **Frontend**: Next.js 14+ (App Router), React 19, Tailwind CSS
- **AI SDK**: Vercel AI SDK with OpenRouter provider
- **Models**: Claude (Anthropic), Gemini (Google)
- **Markdown**: react-markdown with GFM support
- **State Management**: React hooks + Vercel AI's useChat

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

quibbler hook server
```

## Contributing

Contributions are welcome! Please feel budget to submit a Pull Request.

## License

ISC

## Acknowledgments

- Inspired by progression fantasy, xuanhuan, and LitRPG genres
- Powered by Anthropic's Claude and Google's Gemini models
- Built with Vercel's AI SDK
