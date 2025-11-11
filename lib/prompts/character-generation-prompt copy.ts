export const CHARACTER_GENERATION_PROMPT = `**COMPREHENSIVE WORLD-DRIVEN TEXT ADVENTURE - CHARACTER & LOCAL CONTEXT GENERATION**

Given the world bible, generate a random character and their complete local context.

**TOOL USAGE:**
You MUST use these tools for ALL randomness and calculations:
- **random_number_given_min_max**: For ALL random values
- **random_choice_with_weights**: For ALL weighted selections
- **calculator_pemdas**: For ALL mathematical calculations

**GENERATION WORKFLOW:**

<thinking>
In this thinking section:
1. Review the world bible to understand the setting
2. Perform ALL random tool calls needed for character and local generation here
3. First randomly select the character's starting region
4. Then randomly determine their position using actual demographics
5. Finally generate all local context around them
6. Document each random result
</thinking>

**STEP 1: CHARACTER PLACEMENT**
Randomly place character in the world:
1. Select starting region (random_choice weighted by population)
2. Select settlement type within region (random_choice weighted by demographics)
3. Determine character's social position (random_choice weighted by actual class distribution)
4. Generate age (random_number 6-15, the only fixed constraint)
5. Determine if character has any special circumstances (use very low probability)

**STEP 2: LOCAL GEOGRAPHY & STRUCTURE**
Define the immediate physical environment:
- Determine appropriate radius for "local area" based on settlement type
- Settlement layout and size
- Buildings and landmarks
- Natural features and hazards
- Hidden locations and secret areas
- Accessibility to other regions
- Local climate and conditions
- <spoiler>Secret passages and hidden dangers</spoiler>
- <spoiler>Undiscovered ruins or artifacts</spoiler>

**STEP 3: LOCAL POWER SYSTEMS & RESOURCES**
What's available in this specific area:
- Access to power systems (training, materials, mentors)
- Technology level of immediate area
- Available resources and scarcity
- Local economic drivers
- Educational opportunities
- <spoiler>Hidden power sources</spoiler>
- <spoiler>Forbidden knowledge nearby</spoiler>

**STEP 4: LOCAL SOCIETY & MECHANICS**
How this specific settlement functions:
- Local government and authority
- Economic conditions and employment
- Social dynamics and tensions
- Communication with outside world
- Local customs and traditions
- Crime and safety levels
- <spoiler>Corruption and real power structure</spoiler>

**STEP 5: LOCAL PLAYERS & NPCS**
People in immediate interaction range:
- Determine appropriate number of NPCs based on settlement size
- Authority figures (guards, officials, leaders)
- Economic actors (merchants, employers, craftsmen)
- Social contacts (potential friends, rivals, mentors)
- Dangerous individuals (criminals, predators)
- For each: name, role, public persona, routine
- <spoiler>Secret identities (spies, cultists, shapeshifters)</spoiler>
- <spoiler>Hidden agendas and loyalties</spoiler>
- <spoiler>Who would betray for what price</spoiler>
- <spoiler>Who has hidden power or knowledge</spoiler>

**STEP 6: LOCAL PLOTS & THREATS**
Immediate dangers and opportunities:
- Active threats in the area
- Local power struggles
- Economic opportunities and traps
- Available quests appropriate to character level
- <spoiler>Serial killer/monster hunting patterns</spoiler>
- <spoiler>Disease about to outbreak</spoiler>
- <spoiler>Cult activities and recruitment</spoiler>
- <spoiler>Incoming disasters or conflicts</spoiler>
- <spoiler>Traps and schemes targeting newcomers</spoiler>

**STEP 7: CHARACTER DETAILS**
Based on all above, detail the character:
- Name (appropriate to local culture)
- Age (from random 6-15)
- Social position (from earlier random selection)
- Current resources (money, possessions, shelter)
- Knowledge (limited by position and age)
- Relationships (family, contacts, debts)
- Immediate problems and concerns
- Daily routine and obligations
- What character believes about the world
- <spoiler>What character doesn't know that could hurt them</spoiler>
- <spoiler>False beliefs character holds</spoiler>
- <spoiler>Who's watching or targeting them</spoiler>

**STEP 8: TIMELINE & MOMENTUM**
Predetermined local events:
- Determine appropriate timeline scope based on plot complexity
- Generate event schedule with escalating severity
- <spoiler>Specific dated events</spoiler>
- <spoiler>NPC action schedules</spoiler>
- <spoiler>When news from outside arrives</spoiler>
- <spoiler>When various plots trigger</spoiler>

**OUTPUT FORMAT (must include <local_context> and <character> tags with closing tags):**

<thinking>
[Document your complete generation process here, including:
- All random tool calls and results
- Character placement logic
- Local world building decisions
- How local elements connect to larger world]
</thinking>

<local_context>
[COPY THE ENTIRE WORLD BIBLE FROM THE INPUT HERE]

---

# Local Context

## CHARACTER'S REGION: [Name from world bible]
### Regional Summary
[Brief overview from world bible]

## LOCAL AREA: [Specific settlement/location name]
### Physical Layout
[Complete description of immediate area]

### Local Power & Resources
[What's available here]

### Local Society
[How this place functions day-to-day]

## LOCAL NPCS
[List of NPCs with public information]

<spoiler>
### NPC Secrets
[Hidden identities, agendas, and connections]
</spoiler>

## LOCAL THREATS & OPPORTUNITIES
[What character could encounter]

<spoiler>
### Hidden Dangers
[Active threats character doesn't know about]

### Ongoing Schemes
[Local plots and their timelines]
</spoiler>

## TIMELINE
<spoiler>
### Event Schedule
[Detailed event schedule]
</spoiler>
</local_context>

<character>
**Name:** [Generated based on local culture]
**Age:** [Result from random 6-15]
**Social Position:** [Result from demographic-weighted random]
**Current Location:** [Specific place in settlement]

**Background:**
[How they ended up here, family history, etc.]

**Current Situation:**
[Immediate circumstances, problems, daily life]

**Resources:**
- Money: [Amount with currency]
- Possessions: [Items appropriate to position]
- Shelter: [Living situation]
- Food Security: [How they eat]

**Knowledge:**
- Local Area: [What they know about immediate surroundings]
- Regional: [What they've heard about the wider region]
- World: [Usually very little unless position warrants]

**Relationships:**
- Family: [If any]
- Contacts: [Who they know]
- Obligations: [Debts, duties, promises]

**Immediate Concerns:**
[What occupies their thoughts - survival? ambition? duty?]

**Daily Routine:**
[What a typical day looks like]
</character>

**CRITICAL REMINDERS:**
1. Character position must be randomly selected from actual demographics
2. Only age (6-15) is predetermined
3. Create extensive hidden information using <spoiler> tags
4. Local events happen whether character acts or not
5. Character knowledge is extremely limited
6. Most threats can kill a child/teenager
7. Generate realistic concerns for their position
8. ALL random tool calls must be in the <thinking> section
9. Output <local_context> and <character> tags AFTER all tool use is complete`;
