# Claude Instructions

When working on this project, always refer to the comprehensive project requirements document:

**📄 [PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md)**

This document contains the complete vision, technical specifications, and development roadmap for the Interactive Worlds project.

## Quick Reference

### Project Overview

An AI-powered interactive story/RPG system with dual AI architecture (Claude + Gemini), infinite memory through RAG, and sophisticated world consistency.

### Key Components

1. **Story Module** - Core narrative system with story bible
2. **Entity Module** - Graph-based entity tracking with relationships
3. **RAG Module** - Vector search for infinite memory
4. **World Consistency** - Set seed generation for deterministic worlds
5. **Status Card** - Auto-updated character stats and calculations

### Current Status

Review the git status and existing files to determine which modules are already implemented. The system prompt in `lib/prompts/system-prompt.ts` indicates the Story Module foundation is in place.

### Development Approach

- **Modular**: Each feature is a separate module
- **Incremental**: Build and test each module before moving to the next
- **Performance-focused**: Parallel processing, caching, and optimization
- **Cost-conscious**: Use appropriate model tiers (Gemini Flash vs Pro)

### Technology Stack

- **Frontend**: Next.js, React, TypeScript
- **AI**: AI SDK with OpenRouter (Claude + Gemini)
- **Database**: PostgreSQL with pgvector extension (for RAG)
- **Caching**: OpenRouter caching + custom caching layer

## When Making Changes

1. **Always check** PROJECT_REQUIREMENTS.md for specifications
2. **Maintain consistency** with established architecture
3. **Follow the modular approach** outlined in the roadmap
4. **Consider performance** and cost implications
5. **Update documentation** if adding new features or changing architecture

## Key Design Principles

- **Concise responses**: Keep story narration focused and punchy
- **Real consequences**: Death is possible, traps are real, bad decisions matter
- **Player agency**: Never take actions for the player unless established
- **Consistency**: Use entity graph and RAG for perfect memory
- **Transparency**: Use `<thinking>` and `<spoiler>` tags appropriately

## Questions?

If implementation details are unclear:

1. Check PROJECT_REQUIREMENTS.md for the full specification
2. Review existing code in the codebase for patterns
3. Ask the user for clarification if truly ambiguous

Please use these models:

- Budget: anthropic/claude-haiku-4.5 + google/gemini-2.5-flash

- Pro: anthropic/claude-sonnet-4.5 + google/gemini-2.5-pro
