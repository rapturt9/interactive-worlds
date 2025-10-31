/**
 * Tag Parser for XML-style tags in LLM responses
 * Handles nested tags like <thinking>, <spoiler>, <bible>, <character>, <chat_name>
 */

export interface ParsedTags {
  bible?: string;
  character?: string;
  chatName?: string;
  content: string; // Content with tags processed based on debug mode
}

/**
 * Extract content from a specific XML tag
 * Handles nested tags by finding matching opening/closing pairs
 */
export function extractTag(text: string, tagName: string): string | null {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;

  const startIdx = text.indexOf(openTag);
  if (startIdx === -1) return null;

  const contentStart = startIdx + openTag.length;
  let depth = 1;
  let idx = contentStart;

  while (idx < text.length && depth > 0) {
    if (text.substring(idx, idx + openTag.length) === openTag) {
      depth++;
      idx += openTag.length;
    } else if (text.substring(idx, idx + closeTag.length) === closeTag) {
      depth--;
      if (depth === 0) {
        return text.substring(contentStart, idx);
      }
      idx += closeTag.length;
    } else {
      idx++;
    }
  }

  return null;
}

/**
 * Remove all instances of a tag from text
 */
export function removeTag(text: string, tagName: string): string {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;

  let result = text;
  let startIdx = result.indexOf(openTag);

  while (startIdx !== -1) {
    let depth = 1;
    let idx = startIdx + openTag.length;

    while (idx < result.length && depth > 0) {
      if (result.substring(idx, idx + openTag.length) === openTag) {
        depth++;
        idx += openTag.length;
      } else if (result.substring(idx, idx + closeTag.length) === closeTag) {
        depth--;
        if (depth === 0) {
          // Remove the entire tag including open and close
          result = result.substring(0, startIdx) + result.substring(idx + closeTag.length);
          break;
        }
        idx += closeTag.length;
      } else {
        idx++;
      }
    }

    startIdx = result.indexOf(openTag);
  }

  return result;
}

/**
 * Parse world generation response for bible, character, and chat_name tags
 */
export function parseWorldGenerationTags(text: string): ParsedTags {
  const bible = extractTag(text, 'bible');
  const character = extractTag(text, 'character');
  const chatName = extractTag(text, 'chat_name');

  // Remove all extracted tags from content
  let content = text;
  if (bible) content = removeTag(content, 'bible');
  if (character) content = removeTag(content, 'character');
  if (chatName) content = removeTag(content, 'chat_name');

  return {
    bible: bible || undefined,
    character: character || undefined,
    chatName: chatName || undefined,
    content: content.trim(),
  };
}

/**
 * Process content for display based on debug mode
 * Removes <thinking> tags in non-debug mode
 * Converts <spoiler> tags to markdown spoiler blocks
 */
export function processContentForDisplay(text: string, debugMode: boolean): string {
  let result = text;

  // Remove thinking tags if not in debug mode
  if (!debugMode) {
    result = removeTag(result, 'thinking');
  }

  // Convert spoiler tags to markdown spoiler blocks
  result = result.replace(/<spoiler>/g, '```spoiler\n');
  result = result.replace(/<\/spoiler>/g, '\n```');

  // Convert thinking tags to markdown thinking blocks (for debug mode)
  if (debugMode) {
    result = result.replace(/<thinking>/g, '```thinking\n');
    result = result.replace(/<\/thinking>/g, '\n```');
  }

  return result.trim();
}

/**
 * Inject bible and character content into gameplay system prompt
 */
export function injectContentIntoPrompt(
  template: string,
  replacements: { [key: string]: string }
): string {
  let result = template;

  for (const [key, value] of Object.entries(replacements)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  return result;
}
