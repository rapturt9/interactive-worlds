# Interactive Worlds - Project Requirements Document

## Project Overview

An AI-powered interactive story/RPG system featuring dual AI architecture (Claude for storytelling + Gemini for context management), dynamic world consistency, and sophisticated entity tracking. The system provides realistic, consequence-driven narratives with deep mechanical simulation and infinite memory through intelligent context management.

---

## Core Architecture

### Dual AI System

**Claude (Storytelling Engine)**
- Narration and story progression
- Mechanics simulation and calculations
- Decision logic and counterfactual analysis
- Embeds `<thinking>` and `<spoiler>` tags throughout responses
- Calculator integration for dice rolls and probability
- Always considers counterfactuals before confirming success

**Gemini (Context Manager)**
- Story bible maintenance and updates
- Context window optimization (prevents Claude from running out of context)
- Entity graph management and updates
- Background consistency checking
- Requires: most recent message + full bible + tool calls
- Updates full bible every few turns for consistency and plot advancement

### Status Card System

**Auto-Updated Attributes**
- Character attributes (strength, intelligence, etc.)
- Aptitudes and skills
- Assets and inventory
- Resources (money, items, etc.)
- Calculated automatically at end of each turn
- Math calculations shown explicitly (e.g., "45 - 3 - 2 - 2 = 38")

### Story Bible Architecture

**Key-Value Database**
- Stores extensive information per entity
- Large story bible maintained by Gemini
- Smaller, relevant portions provided to Claude each turn
- Auto-loads entities relevant to current context
- Updates after each user query

**Bible Update Cycle**
- Gemini recreates focused bible for Claude based on context
- Full bible stored separately (complete world state)
- Agent updates full bible for consistency every few turns
- Advances hidden plots and conspiracies automatically

---

## Key Design Principles

### Narrative Quality

**Conciseness**
- Shorter, more concise responses
- Focus on action and consequences
- Avoid unnecessary exposition

**Player Agency**
- Story presents characters/situations but doesn't think for player
- No automatic actions unless previously established
- No internal thought process narrated unless consistent with character
- Only execute actions player has explicitly chosen

**Consequences**
- Punish bad decisions realistically
- Death is possible
- No plot armor
- Real traps with subtle clues only

**Challenge Design**
- Traps should be real and dangerous
- Clues are very subtle (no allusions unless character has detection skills)
- Character shouldn't know about traps unless they have relevant skills

### Storytelling Techniques

**Spoiler Tags**
- Used throughout responses for hidden information
- Specify spoiler type: `<spoiler type="plot">`, `<spoiler type="decision">`, etc.
- Player can view all hidden plots and their progression
- Reveals conspiracy tracking and world state

**Thinking Tags**
- `<thinking>` tags show Claude's reasoning process
- Includes counterfactual analysis
- Shows calculation logic and probability assessments

### Mechanics & Randomness

**Randomness Scope**
- Only for key events (reduces latency)
- Focus on: success/failure of efforts, NPC attitudes for key interactions
- All randomness processed through Claude with calculator access
- Always consider counterfactuals before determining outcomes
- Dice rolls done by Claude with explicit thinking

**Time Management**
- Time skips available to player
- Hints provided for available actions
- World events progress during time skips

---

## World Consistency System

### Across-World Consistency

**Set Seed Generation**
- Use deterministic seeds for world generation
- All priors determine first state of world
- Reconcile with current state using current bible
- Ensures consistency across sessions

**Hierarchical Geography System**

Separate into tiles with cascading questions from largest to smallest:

1. **Realms & Dimensions**
   - What exists in each realm
   - Coordinates of major places

2. **Initial State & Velocity**
   - Starting conditions
   - Direction/momentum of change
   - Reconciliation to current state

3. **Routing & Connections**
   - "How to go from X to Y"
   - Ask all directions globally to local area
   - Cascade from world-level to local-level

4. **Key Questions per Location**
   - What are all locations? (provinces with coordinates)
   - What are all routes | locations? (include border town connections)
   - Who are all major players | locations?
   - What are all plots | locations, players?
   - What is here (objects) | locations? (minerals, animals, etc.)

**Parallel Processing**
- Geography questions run asynchronously while status card calculates
- Uses fast model (Gemini) for initial generation
- Initial conditions and velocity generated with Gemini 2.5 Pro
- Reconciliation also uses Pro for quality
- Consider Gemini Flash Thinking for speed/quality trade-off

**Map Generation**
- Set seed generation for consistent maps
- Hierarchical coordinate system
- Caching of initial bible for performance

---

## Development Roadmap (Modular Releases)

### Phase 1: Story Module ✓
**Priority: Release 1**

- Story bible with updates, hidden plots, spoiler masking
- UI for story display and interaction
- Reference classes for accuracy (not always helping character)
- System prompt integration
- AI SDK with OpenRouter
- Caching support (OpenRouter) for cost/speed optimization
- User customization:
  - Prompt for world type
  - Starting character attributes
  - Option to use defaults

**Tech Stack:**
- AI SDK
- OpenRouter with caching
- Next.js for UI

### Phase 2: Summarization Module
**Priority: Release 2**

- Automatic conversation summarization
- Replace old context with summaries for infinite chat
- Gemini updates full bible based on summaries
- Claude never runs out of context
- Background process runs every N turns

**Implementation:**
- Gemini takes recent turns + full bible
- Creates concise summary
- Updates bible accordingly
- Replaces old conversation context

### Phase 3: Randomization Module
**Priority: Release 3**

- LLM runs code for dice rolls
- Math calculations for success/failure
- Calculator integration with Claude
- Counterfactual analysis before rolls
- Explicit probability display

**Features:**
- Code execution for random number generation
- Mathematical validation of outcomes
- Thinking tags show calculation process

### Phase 4: Status Card Module
**Priority: Release 4**

- Gemini uses tools to update status asynchronously
- Runs at end of each turn
- Feeds to next turn (or turn after)
- Visual status card UI component

**Status Tracking:**
- Attributes (strength, intelligence, etc.)
- Aptitudes and skills
- Assets and inventory
- Resources with calculations
- Health, conditions, effects

### Phase 5: Learning Module
**Priority: Release 5**

- Set learning goals for player
- Story oriented toward teaching real-world skills
- Embed lessons naturally in narrative
- Track skill acquisition

**Real-World Skills:**
- Negotiation
- Leadership
- Strategic thinking
- Resource management
- Risk assessment
- Discipline and willpower

### Phase 6: Entity Module
**Priority: Release 6 - Critical for Consistency**

**Entity Database Schema:**

```typescript
interface Entity {
  id: string
  name: string
  type: string // character, location, object, faction, etc.

  attributes: Record<string, any> // flexible attributes
  description: string // brief description
  full_description: string // detailed description

  // Relationship Graph
  relationships: Array<{
    target_entity_id: string
    relationship_type: string
    strength: number
    description: string
  }>

  // Temporal Information
  velocity: {
    direction: string // where entity is heading
    timeframe: string
    description: string
  }

  history: Array<{
    timestamp: string
    version: number
    change_description: string
  }>

  summary: string // expensive, updated infrequently

  version: number
  last_updated: string
}
```

**Entity Graph System:**
- Nodes: All entities (characters, locations, objects, factions, etc.)
- Edges: Relationships (auto-generated from full_description)
- Versioning: Track all changes with history
- Background updates by agent/Gemini

**Update Strategy:**
- Every turn: Update relevant entities (description, attributes, relationships)
- Less frequent: Update expensive summaries (background process)
- Graph + summaries must fit in 1M context window
- Gemini takes: few recent turns + full graph
- Makes modifications through tool calls or structured updates
- Continuously spots and fixes inconsistencies

**Benefits:**
- Drastically increased memory
- Better story consistency
- Relationship tracking
- Historical continuity
- Background consistency checks

### Phase 7: RAG Module
**Priority: Release 7 - Enables Infinite Memory**

**Extension to Entity Module:**
- Infinite memory through vector search
- Gemini only updates relevant portion of graph
- All entities stored in database with vector embeddings

**RAG Implementation:**

```typescript
interface VectorEntity extends Entity {
  embedding: number[] // vector embedding of entity summary
  metadata: {
    importance: number
    last_accessed: string
    access_count: number
  }
}
```

**Query Strategy:**
- Base queries: Current context and entities
- Add: Previous conversational turns
- Fetch: Highest similarity entities only
- Update: Only fetched entities (ensures fits in context)

**Dual RAG Usage:**
1. **Chat RAG**: Add most relevant bible items from few turns ago
   - User doesn't wait for Gemini
   - Instant relevant context

2. **Bible RAG**: Gemini fetches relevant entities to update
   - Only updates relevant subgraph
   - Scales to infinite entities

**Optimization:**
- Importance scoring for entities
- Recency weighting
- Access pattern tracking

---

## World Consistency Releases

### Phase 8: Location Consistency Module
**Priority: Release 8**

**Set Seed Generation:**
- Deterministic location generation
- Hierarchical coordinate system
- Doesn't change across runs

**Generation Hierarchy:**
1. Realms/Dimensions
2. Continents
3. Regions
4. Provinces
5. Cities/Towns
6. Specific locations

**Resolving System:**
- Initial state + velocity → current state
- Reconcile discrepancies
- Update bible accordingly

**Fidelity Management:**
- Expand detail as needed
- Other characters know about locations player doesn't
- Information propagation system
- NPCs can tell player about unknown locations

**Questions per Level:**
- What exists here?
- What are the boundaries?
- Who controls this area?
- What resources are present?
- What dangers exist?

### Phase 9: Generic World Generation
**Priority: Release 9**

**Universal Questions:**
- Apply to all entity types (people, plots, objects, etc.)
- Not oriented to user actions (generic world state)
- Deterministic with set seeds

**Question Templates:**
- "What exists in [location]?"
- "Who are the major players in [location]?"
- "What plots/conflicts are active in [location]?"
- "What resources exist in [location]?"
- "What objects/artifacts are present in [location]?"

**Entity Types:**
- People (NPCs, factions, organizations)
- Plots (conspiracies, conflicts, plans)
- Objects (minerals, artifacts, plants, animals)
- Locations (buildings, dungeons, landmarks)
- Events (scheduled, cyclical, random)

### Phase 10: Possibility Module
**Priority: Release 10**

**Possibility Assessment:**
- "Is X possible?"
- "How hard is X?"
- "What are the requirements for X?"

**Generation Based On:**
- Rules of the world
- Scientific principles (if applicable)
- Magic system constraints
- Economic feasibility
- Social/political constraints
- Historical precedent

**Consistency:**
- Set seed generation
- Cached results for common queries
- Reconciliation with current world state

**Examples:**
- Can teleportation be learned? → Check magic system
- Can this mountain be climbed? → Check geography + character capabilities
- Can this faction be allied with? → Check politics + relationships

### Phase 11: Map Module
**Priority: Release 11**

**Visual Mapping:**
- Using location data + coordinates (LLM-generated)
- Hierarchical from top level down
- Path tracking (show user's journey)
- Dynamic map updates

**Features:**
- Current location highlighting
- Visited locations marked
- Known but unvisited locations shown
- Unknown areas hidden (fog of war)
- Path history visualization

**Technical Implementation:**
- SVG or Canvas-based rendering
- Zoom levels for hierarchy
- Interactive navigation

### Phase 12: Map Image Module
**Priority: Release 12**

**Image Generation:**
- Create images of each map level
- Artistic rendering of locations
- Visual consistency with world theme
- Generated on-demand or cached

**Features:**
- Different art styles per world type
- Location-specific imagery
- Dynamic updates based on world state

### Phase 13: Storybook Module
**Priority: Release 13**

**Journey Documentation:**
- Images of key moments
- User can generate images on demand
- Comprehensive journey tracking
- Review entire journey

**Features:**
- Automatic key moment detection
- Manual image generation option
- Timeline view
- Gallery of important scenes
- Satisfaction-focused UX

**Journey Tracking:**
- Major decisions and outcomes
- Character progression milestones
- Significant relationships
- World-changing events

### Phase 14: Place in Story Module
**Priority: Release 14**

**Existing Story Bibles:**
- Create bibles for popular stories
- Examples: Reverend Insanity, Harry Potter, etc.
- Use world consistency system
- Play as any character in the world

**Implementation:**
- Pre-generated world bibles
- Full entity graphs for story worlds
- Accurate power systems and rules
- Timeline placement options

**Features:**
- Character selection (play as canon or custom character)
- Timeline selection (different points in story)
- Canon compliance options (strict or loose)
- Interaction with canon characters

### Phase 15: Tournament Module / See Others' Journeys
**Priority: Release 15**

**Same World Multiplayer:**
- Multiple players in same generated world
- Classification of player progress
- View other players' stories/journeys
- Leaderboards and achievements

**Features:**
- Progress metrics and rankings
- Story sharing (with player permission)
- Achievement system
- Notable moments highlighting
- Cross-player world impact

**Privacy:**
- Opt-in sharing
- Anonymization options
- Spoiler protection

### Phase 16: Mobile Release
**Priority: Release 16**

**Progressive Web App (PWA):**
- Next.js PWA
- Responsive UI for mobile
- Offline support
- Native-like experience

**Mobile Optimizations:**
- Touch-friendly interface
- Reduced bandwidth usage
- Mobile-specific UI patterns
- Push notifications for turn updates

### Phase 17: Ongoing Quality Improvements
**Priority: Continuous**

**User Feedback Integration:**
- Community feature requests
- Bug fixes and optimizations
- Balance adjustments
- New world types and systems

**Metrics:**
- User engagement
- Story completion rates
- Player satisfaction surveys
- Performance monitoring

---

## Technical Implementation Details

### AI SDK & API Usage

**Primary Models:**
- Claude (via Anthropic or OpenRouter): Story narration, decision logic
- Gemini 2.5 Pro: Bible updates, initial world generation
- Gemini Flash Thinking: Fast operations, status updates (evaluate speed/quality)

**Caching Strategy:**
- OpenRouter caching for repeated prompts
- Cache initial world bibles
- Cache entity embeddings (RAG)
- Cache common world queries

**API Configuration:**
```typescript
const claudeConfig = {
  model: "claude-sonnet-4-5",
  provider: "openrouter", // or "anthropic"
  caching: true,
  maxTokens: 4096
}

const geminiConfig = {
  model: "gemini-2.5-pro", // or "gemini-flash-thinking"
  provider: "openrouter",
  caching: true
}
```

### Database Schema

**Core Tables:**
```sql
-- Entities (for Entity Module + RAG)
CREATE TABLE entities (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(50),
  attributes JSONB,
  description TEXT,
  full_description TEXT,
  summary TEXT,
  velocity JSONB,
  version INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Entity Relationships
CREATE TABLE entity_relationships (
  id UUID PRIMARY KEY,
  source_entity_id UUID REFERENCES entities(id),
  target_entity_id UUID REFERENCES entities(id),
  relationship_type VARCHAR(100),
  strength FLOAT,
  description TEXT,
  created_at TIMESTAMP
);

-- Entity History (Versioning)
CREATE TABLE entity_history (
  id UUID PRIMARY KEY,
  entity_id UUID REFERENCES entities(id),
  version INT,
  change_description TEXT,
  snapshot JSONB,
  timestamp TIMESTAMP
);

-- Vector Embeddings (for RAG)
CREATE TABLE entity_embeddings (
  entity_id UUID PRIMARY KEY REFERENCES entities(id),
  embedding vector(1536), -- adjust dimension based on model
  metadata JSONB,
  updated_at TIMESTAMP
);

-- Story Sessions
CREATE TABLE story_sessions (
  id UUID PRIMARY KEY,
  user_id UUID,
  world_seed VARCHAR(255),
  current_bible JSONB,
  status_card JSONB,
  turn_count INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Conversation History
CREATE TABLE conversation_turns (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES story_sessions(id),
  turn_number INT,
  user_input TEXT,
  assistant_response TEXT,
  bible_updates JSONB,
  status_updates JSONB,
  timestamp TIMESTAMP
);

-- World Seeds & Initial States
CREATE TABLE world_seeds (
  seed VARCHAR(255) PRIMARY KEY,
  world_type VARCHAR(100),
  initial_bible JSONB,
  generation_config JSONB,
  created_at TIMESTAMP
);
```

### Tool Integration

**Calculator Tool (for Claude):**
```typescript
const calculatorTool = {
  name: "calculator",
  description: "Perform mathematical calculations and random number generation",
  input_schema: {
    type: "object",
    properties: {
      expression: {
        type: "string",
        description: "Math expression to evaluate"
      },
      random: {
        type: "object",
        properties: {
          type: { enum: ["dice", "range", "probability"] },
          params: { type: "object" }
        }
      }
    }
  }
}
```

**Status Update Tool (for Gemini):**
```typescript
const statusUpdateTool = {
  name: "update_status",
  description: "Update character status card",
  input_schema: {
    type: "object",
    properties: {
      updates: {
        type: "object",
        properties: {
          attributes: { type: "object" },
          resources: { type: "object" },
          conditions: { type: "array" }
        }
      },
      calculations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string" },
            operation: { type: "string" },
            result: { type: "number" }
          }
        }
      }
    }
  }
}
```

**Entity Update Tool (for Gemini):**
```typescript
const entityUpdateTool = {
  name: "update_entities",
  description: "Update entity graph",
  input_schema: {
    type: "object",
    properties: {
      entity_ids: { type: "array", items: { type: "string" } },
      updates: { type: "array", items: { type: "object" } },
      new_relationships: { type: "array" },
      removed_relationships: { type: "array" }
    }
  }
}
```

### Prompt Engineering

**Claude System Prompt Structure:**
```
[Core Instructions]
- Storytelling mode
- Use <thinking> and <spoiler> tags
- Focus on counterfactuals
- Explicit calculations
- No actions without player input

[World Context] (from Gemini)
- Relevant entities
- Current plots
- Active threats
- Status card

[Story Bible] (condensed)
- Key information for current context
- Hidden information in spoilers

[Response Format]
- Narrative (concise)
- Calculations (explicit)
- Spoiler tags for hidden info
- Thinking tags for reasoning
- 3-4 action options
```

**Gemini System Prompt Structure:**
```
[Role: Context Manager]
- Maintain full story bible
- Update entity graph
- Provide relevant context to Claude
- Spot and fix inconsistencies

[Bible Management]
- Track all entities and relationships
- Version all changes
- Advance hidden plots
- Update world state

[Output Format]
- Relevant context for Claude
- Bible updates (delta only)
- Entity modifications
- Consistency notes
```

### UI Components

**Status Card Component:**
```tsx
interface StatusCardProps {
  attributes: Record<string, number>
  resources: Record<string, number>
  conditions: string[]
  calculations: Calculation[]
}
```

**Story Display Component:**
```tsx
interface StoryDisplayProps {
  narrative: string
  spoilers: Spoiler[]
  thinking: string[]
  options: ActionOption[]
}
```

**Entity Graph Viewer (Debug/Admin):**
```tsx
interface EntityGraphProps {
  entities: Entity[]
  relationships: Relationship[]
  focusEntityId?: string
}
```

---

## Performance Considerations

### Latency Reduction

1. **Parallel Processing:**
   - Run status calculations while Claude narrates
   - Gemini updates bible asynchronously
   - Geography generation during other operations

2. **Caching:**
   - Cache initial world bibles
   - Cache common entity queries
   - Cache vector embeddings

3. **Model Selection:**
   - Use faster models (Gemini Flash) for non-critical operations
   - Reserve Pro models for generation and critical updates
   - Consider Gemini Flash Thinking for balance

4. **Incremental Updates:**
   - Only send bible deltas to Claude
   - Update only relevant entities in graph
   - Lazy load entity summaries

### Cost Optimization

1. **Token Usage:**
   - Compress bible context
   - Use summaries instead of full text when possible
   - Cache repeated prompts

2. **Model Tiers:**
   - Gemini Flash for routine operations
   - Gemini Pro for critical generation
   - Claude for storytelling only

3. **OpenRouter Caching:**
   - Enable caching for all static prompts
   - Cache world generation results
   - Cache entity embeddings

---

## Testing Strategy

### Unit Tests
- Entity CRUD operations
- Bible update logic
- Calculation correctness
- RAG query accuracy

### Integration Tests
- Claude + Gemini coordination
- Tool execution flow
- Database consistency
- Cache invalidation

### End-to-End Tests
- Full story session
- World generation
- Entity graph updates
- Multi-turn consistency

### Performance Tests
- Latency benchmarks
- Token usage monitoring
- Cache hit rates
- Database query performance

---

## Security & Privacy

### API Key Management
- Secure storage of API keys
- Environment variable configuration
- No client-side exposure

### User Data
- Story session privacy
- Optional sharing controls
- Data export capabilities
- Account deletion support

### Content Moderation
- Appropriate content guidelines
- User reporting system
- Automated content screening (if needed)

---

## Deployment Strategy

### Development Environment
- Local Next.js dev server
- Local database (PostgreSQL with pgvector)
- Mock API responses for testing

### Staging Environment
- Vercel or similar platform
- Production-like database
- Full API integration
- Limited user testing

### Production Environment
- Auto-scaling hosting (Vercel recommended)
- Production database with backups
- CDN for static assets
- Monitoring and alerting
- Rate limiting

---

## Future Considerations

### Advanced Features
- Voice narration (TTS)
- Voice input (STT)
- Real-time multiplayer
- Mod/extension system
- Community-created worlds
- Export to novel format

### Monetization (if applicable)
- Free tier with limitations
- Premium features
- One-time purchase option
- No pay-to-win mechanics

### Analytics
- Player behavior tracking
- Story completion rates
- Popular world types
- Decision patterns
- Retention metrics

---

## Success Metrics

### User Engagement
- Average session length
- Return rate
- Story completion rate
- User satisfaction scores

### Technical Performance
- Average response latency
- API cost per session
- Cache hit rate
- Error rate

### Content Quality
- Story consistency scores (manual review)
- User feedback on narrative quality
- Bug reports related to inconsistencies

---

## Appendix: Reference Materials

### Inspiration Sources
- **Xuanhuan/Xianxia**: Cultivation progression, massive scale
- **Progression Fantasy**: Clear power systems, satisfying growth
- **LitRPG**: Stats, skills, game mechanics
- **Example Stories**: Reverend Insanity, Harry Potter, etc.

### Technical References
- AI SDK documentation
- OpenRouter API docs
- Vercel AI SDK
- pgvector for RAG
- Next.js documentation

### Design Philosophy
- **Player Respect**: No forced actions, real consequences
- **World Realism**: Consistent rules, logical outcomes
- **Challenge**: Real difficulty, meaningful decisions
- **Satisfaction**: Progression, discovery, mastery
