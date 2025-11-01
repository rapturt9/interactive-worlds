export const WORLD_GENERATION_PROMPT = `**COMPREHENSIVE WORLD-DRIVEN TEXT ADVENTURE - WORLD GENERATION**

You are creating an immersive text adventure world at cosmic scale. Generate the complete world bible and chat name.

**TOOL USAGE:**
You MUST use these tools for ALL randomness and calculations:
- **random_number_given_min_max**: For ALL random values
- **random_choice_with_weights**: For ALL weighted selections
- **calculator_pemdas**: For ALL mathematical calculations

Before using each tool, explain your reasoning for why you are using it, what the randomness is generated for, only create tool calls with reasoning beforehand. Don't make unnecessary tool calls.

**GENERATION WORKFLOW:**

<thinking>
In this thinking section:
1. Explain your world design approach
2. Perform ALL random tool calls needed for world generation here
3. Explain what you are rolling for, document each random result and what it determines
4. Calculate derived values using the calculator tool
5. Build the world systematically using the random results
</thinking>

**STEP 1: UNIVERSE STRUCTURE & GEOGRAPHY**
Determine the scale and physical structure:
- Universe scale (use random_number to determine: planet, system, galaxy, multiverse, etc.) - note nothing else will exis outside of this universe
- Based on scale, generate appropriate number of major locations
- Geographic/cosmic complexity and connections
- Temporal properties and physics variations
- Create unique names for all locations
- Natural resources and phenomena distribution

**STEP 2: POWER SYSTEMS & NATURAL LAWS**
Establish what's possible in this universe:
- Existence and / or complexity of supernatural powers (use random_number)
- Technology levels across different regions
- How powers and technology interact
- Universal constants (death mechanics, information speed, etc.)
- Power progression mechanics if applicable
- Distribution of power levels in population

**STEP 3: WORLD MECHANICS & SYSTEMS**
Define how civilization functions:
- Economic systems, currencies, trade networks
- Social hierarchies and mobility rates
- Information and communication networks
- Cultural variations across regions
- Legal and governmental structures
- Education and knowledge systems
- Random event tables (disasters, discoveries, conflicts)

**STEP 4: MAJOR PLAYERS & CIVILIZATIONS**
Populate with major powers:
- Number based on universe scale
- For each: name, type, territory, population, resources
- Power structures and leadership
- Public goals and diplomatic relations
- <spoiler>Secret agendas and true nature</spoiler>
- <spoiler>Hidden weaknesses and vulnerabilities</spoiler>
- <spoiler>What they know that others don't</spoiler>

**STEP 5: ACTIVE PLOTS & CONSPIRACIES**
Create ongoing conflicts at various scales:
- Cosmic/existential threats
- Wars and major conflicts
- Political machinations
- Economic competitions
- Religious/ideological struggles
- <spoiler>Hidden puppet masters pulling strings</spoiler>
- <spoiler>Countdown timers to disasters</spoiler>
- <spoiler>Secret alliances and betrayals brewing</spoiler>
- <spoiler>Ancient evils stirring</spoiler>

**STEP 6: POPULATION DEMOGRAPHICS**
Generate realistic population distributions:
- By region/world/dimension
- By social class (generate percentages that sum to 100%)
- By power level (if applicable)
- By species/race (if multiple)
- Urban vs rural distributions
- Age distributions

**OUTPUT FORMAT (must include <bible> and <chat_name> tags with closing tags):**

<thinking>
[Document your complete generation process here, including:
- All random tool calls and their results
- Your reasoning for world design choices
- How different elements connect
- Major themes and conflicts]
</thinking>

<bible>
# Story Bible

## UNIVERSE STRUCTURE
[Complete description of scale, geography, temporal properties]

## POWER SYSTEMS & NATURAL LAWS
[Detailed explanation of what's possible and how]

## WORLD MECHANICS
[How civilization and society function]

## MAJOR CIVILIZATIONS
[List each with full details]

<spoiler>
### Hidden Knowledge
[Secret information about major players]
</spoiler>

## ACTIVE CONFLICTS & PLOTS
[Public knowledge of conflicts]

<spoiler>
### Secret Plots & Conspiracies
[All hidden schemes and their timelines]
</spoiler>

## DEMOGRAPHICS
[Complete population distributions by region and class]

## APPENDIX: REFERENCE TABLES
[Quick reference for costs, power tiers, travel times, etc.]
</bible>

<chat_name>[Short evocative name]</chat_name>

**IMPORTANT:**
- Use randomness extensively to create unexpected combinations
- Include both public and secret information
- Create a living world with events that will happen regardless of any individual
- ALL random tool calls should be in the <thinking> section
- Output <bible> and <chat_name> tags AFTER all tool use is complete
`;
