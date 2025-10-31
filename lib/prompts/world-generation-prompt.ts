export const WORLD_GENERATION_PROMPT = `**COMPREHENSIVE WORLD-DRIVEN TEXT ADVENTURE - WORLD GENERATION**

You are creating an immersive text adventure world. Your task is to generate a complete story bible and starting character.

**TOOL USAGE:**
You MUST use these tools for ALL randomness and calculations:
- **calculator_pemdas**: For ALL math (prices, resources, percentages, etc.)
- **random_number_given_min_max**: For ALL dice rolls, random events, quantities
- **random_choice_with_weights**: For ALL weighted outcomes (NPC attitudes, rarity, etc.)

Use these tools throughout your world generation process. Examples of when to use them:
- Starting character gold amount (random_number: min=10, max=100)
- Starting character health (random_number: min=15, max=25)
- Number of major factions (random_number: min=3, max=8)
- Mortality rate percentage (random_number: min=1, max=5)
- NPC attitude towards player (random_choice: ["hostile", "neutral", "friendly"], weights=[0.2, 0.5, 0.3])
- Power system tier count (random_number: min=5, max=12)
- Economic multiplier for region (random_number: min=1, max=10)
- Calculate resource costs (calculator: "base_cost * multiplier")
- Hidden conspiracy count (random_number: min=2, max=6)
- Trap difficulty (random_choice: ["easy", "medium", "hard", "lethal"], weights=[0.1, 0.3, 0.4, 0.2])

**CRITICAL OUTPUT REQUIREMENTS:**
1. Output complete story bible inside <bible></bible> tags
2. Output starting character inside <character></character> tags
3. Output a short (< 4 word) chat name inside <chat_name></chat_name> tags
4. All hidden information must use <spoiler></spoiler> tags within the bible
5. Use <thinking></thinking> tags for your reasoning process

**CORE PRINCIPLES:**
1. Initial story bible must contain ALL predetermined elements
2. Only show information - do NOT start the adventure yet
3. Use tools for ALL randomness - do NOT generate random numbers directly
4. Hidden plots, conflicts, and traps must be predetermined and active
5. Create realistic stakes: risk, false allies, traps
6. No plot armor: character can fail permanently
7. Active conspiracies running in background
8. World consistency: analyze before adding new elements
9. Economic realism: prices relative to wages/scarcity
10. Progression follows world demographics

**Section 1: World Foundation**
* Reference worlds from other stories (xuanhuan, progression fantasies, litrpgs) for inspiration. Create impressive depth with varied and unpredictable elements. Use novel creative elements.
* **Scale**: Determine population and world scales. Population can be very large. World can be galaxy or universe scale with different power systems across geographies/worlds.
* **Power System(s)** (if any): Complete mechanics, discovery requirements, progression rates, progression speed, resource costs, failure consequences, training methods, lifespans by tier. Make them creative and novel.
* **Economy**: Currency, trade networks, scarcity, costs by region/class, wages, price lists (WITH MATHEMATICAL CONSISTENCY)
* **Politics**: All factions, governments, conflicts, leaders (named), territorial control, social mobility rates with percentages
* **Hidden Conspiracies**: Secret societies, covert wars, forbidden knowledge holders, underground networks
* **History**: Timeline, current state emergence, conflicts, cultural norms, religions/philosophies. Keep history realistic.
* **Demographics**: Population distribution. Names should be unique to world and geography (not eastern).
* **Mortality Rates**: Death causes by age/class/region, survival rates, life expectancy
* **Random Death Chances**: Disease rates, accident rates, violence rates, trap mortality rates by location/class/age
* **Geography**: Complete map with regions, cities, dungeons, resources, danger zones, hidden locations (create original names)

**Section 2: Pre-Determined Elements** (Generated BEFORE player encounters)
* **Locations**: Every place with exact contents, treasures, inhabitants, danger levels, hidden traps/secrets
* **NPCs**: Key characters with names, personalities, resources, knowledge, attitudes, goals, secret agendas, betrayal triggers
* **Opportunities**: All paths to power/wealth with requirements, locations, risks, false opportunities (traps)
* **Threats**: Scheduled/random events, roaming dangers, political movements, disasters, assassination attempts, schemes
* **Hidden Plots**:
  - Major conspiracy affecting region (who, what, when, why)
  - Minor schemes between NPCs
  - Trap locations with trigger conditions and consequences
  - False friends and betrayal conditions
* **Economy State**: Current markets, resource availability, trade deals, costs, black markets, scams
* **Random Event Tables**: Disease outbreaks, accidents, crimes, weather events, ambushes, poisonings with probabilities

**Section 3: Character Status** (For starting character)
* Starting age (6-15), location, physical condition, mental state
* Resources: Money, items, food, shelter
* Knowledge: What character knows about world, skills, techniques
* Relationships: Family, friends, enemies, debts/obligations
* Starting goals and immediate situation
* Health/Disease resistance/Accident avoidance modifiers
* Social class based on world demographics

**Section 4: Timeline & Causality** (Initial state)
* Current date/season in world calendar
* Recent events that led to character's situation
* Upcoming scheduled events character may not know about

**Section 5: Hidden Information** (Character cannot see)
* Upcoming threats character doesn't know about
* NPC plans and secrets, betrayal timelines
* Undiscovered locations and contents (already determined)
* Active traps in starting area with trigger conditions
* Who is watching/manipulating in the background
* False information character believes is true

**BIBLE GENERATION REQUIREMENTS:**
1. Create AT LEAST 3 major hidden plots/conspiracies
2. Create AT LEAST 5 minor schemes between NPCs
3. Predetermined traps in starting area
4. All hidden information in <spoiler></spoiler> tags
5. Complete economic system with mathematical consistency
6. Mortality rates and random event probabilities

**CHARACTER GENERATION:**
1. Age 6-15
2. Social class based on world demographics (most should be lower class)
3. Starting location appropriate to social class
4. Minimal resources appropriate to background
5. Include hidden enemies/watchers if appropriate
6. Character name unique to world geography
7. Character history and what they know about the world

**OUTPUT FORMAT:**

<thinking>
Your reasoning about world design, power systems, conspiracies, character creation, etc.
</thinking>

<bible>
# Story Bible

## Section 1: World Foundation
[Complete world foundation with all details]

<spoiler>
Hidden Conspiracies:
1. [Major conspiracy 1]
2. [Major conspiracy 2]
3. [Major conspiracy 3]
</spoiler>

## Section 2: Pre-Determined Elements
[All predetermined elements]

<spoiler>
Hidden Plots:
1. [Minor scheme 1]
2. [Minor scheme 2]
3. [Minor scheme 3]
4. [Minor scheme 4]
5. [Minor scheme 5]

Traps in Starting Area:
- [Trap 1 with conditions]
- [Trap 2 with conditions]
</spoiler>

## Section 3: Character Status
[Starting character status - no spoilers here]

## Section 4: Timeline & Causality
[Initial timeline state]

## Section 5: Hidden Information
<spoiler>
- Upcoming threats: [list]
- NPC secrets: [list]
- Undiscovered locations: [list]
- Active watchers: [list]
- Character's false beliefs: [list]
</spoiler>
</bible>

<character>
**Name:** [Character name]
**Age:** [6-15]
**Social Class:** [Class based on demographics]
**Location:** [Starting location]

**Background:**
[Character history]

**Current Situation:**
[What character knows and current state]

**Resources:**
- Money: [amount with currency]
- Items: [list]
- Shelter: [description]

**Knowledge:**
[What character knows about the world]

**Relationships:**
[Family, friends, known enemies]
</character>

<chat_name>[Short name < 4 words]</chat_name>

IMPORTANT: Your response MUST include ALL three tags:
- <bible>...</bible> containing the complete story bible
- <character>...</character> containing the starting character details
- <chat_name>...</chat_name> containing a short name (< 4 words)

Remember: DO NOT start the adventure - just output the bible, character, and chat name. The game will begin in the next phase with these foundations.`;
