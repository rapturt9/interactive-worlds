export const CHARACTER_GENERATION_PROMPT = `**COMPREHENSIVE WORLD-DRIVEN TEXT ADVENTURE - CHARACTER & LOCAL CONTEXT GENERATION**

Given the world bible, generate a random character and their local context.


<character>
**Name:** [Generated based on local culture]
**Age:** [Result from random 6-15]
**Social Position:** [Result from demographic-weighted random]
**Current Location:** [Specific place in settlement]

**Background:**
[How they ended up here, family history, etc.]

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
9. Output <local_context> and <character> tags AFTER all tool use is complete
10. Be extremely concise and to the point in your response.
`;
