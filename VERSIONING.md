# Turn-Based Versioning System

## Overview

The Interactive Worlds project now includes a **turn-based versioning system** that automatically saves snapshots of the story bible and character state at each gameplay turn. This enables:

- **Version history** - Track how the story bible and character evolve over time
- **Time-travel** - Go back to any previous turn and restore the exact state
- **Safe experimentation** - Try different choices and rewind if needed
- **No breaking changes** - All data is stored in existing tables

## How It Works

### Automatic Snapshot Creation

Snapshots are automatically saved:

1. **Turn 0** - After character generation completes (initial state)
2. **Turn 1+** - After each assistant response during gameplay

Each snapshot contains:
- `turnNumber` - The turn number (0, 1, 2, ...)
- `bible` - The story bible content at that turn
- `character` - The character sheet content at that turn
- `timestamp` - When the snapshot was created

### Storage Architecture

Snapshots are stored as **special system messages** in the existing `messages` table:

```typescript
// Snapshot message format
{
  id: `${chatId}-snapshot-turn-${turnNumber}`,
  role: 'system',
  content: JSON.stringify({
    type: 'snapshot',
    turnNumber: 0,
    bible: '...',
    character: '...',
    timestamp: '2025-11-01T...'
  }),
  phase: `turn-${turnNumber}`,
  timestamp: '2025-11-01T...'
}
```

**Why system messages?**
- ✅ No new tables needed
- ✅ Leverages existing composite primary key `(id, chat_id, phase)`
- ✅ System messages aren't displayed to users
- ✅ Easy to query by phase
- ✅ Automatic cleanup when chat is deleted (CASCADE)

### Database Schema Changes

Only **one new column** added to `chats` table:

```sql
ALTER TABLE chats ADD COLUMN current_turn INTEGER DEFAULT 0;
```

This tracks the current turn number for each chat.

## API Reference

### Snapshot API (`/api/snapshots`)

#### Save Snapshot (POST)

Saves a snapshot of the current chat state:

```typescript
await fetch('/api/snapshots', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chatId: 'chat-123' }),
});

// Response:
// {
//   success: true,
//   turnNumber: 5,    // The turn that was saved
//   nextTurn: 6       // The new current turn
// }
```

#### Load Snapshot (GET)

Load a specific turn's snapshot:

```typescript
const response = await fetch('/api/snapshots?chatId=chat-123&turn=3');
const data = await response.json();

// data.snapshot:
// {
//   turnNumber: 3,
//   bible: '...',
//   character: '...',
//   timestamp: Date
// }
```

#### Get All Snapshots (GET)

Get all available snapshots for a chat:

```typescript
const response = await fetch('/api/snapshots?chatId=chat-123');
const data = await response.json();

// data.snapshots: TurnSnapshot[]
```

### Database Queries (`lib/db/queries.ts`)

```typescript
// Save a snapshot
await saveTurnSnapshot(chatId, userId, turnNumber, bibleContent, characterContent);

// Load a snapshot
const snapshot = await loadTurnSnapshot(chatId, userId, turnNumber);

// Get current turn
const turn = await getCurrentTurn(chatId, userId);

// Increment turn
const newTurn = await incrementTurn(chatId, userId);

// Get all snapshots
const snapshots = await getAllSnapshots(chatId, userId);
```

### React Hook (`hooks/useChatsManagement.ts`)

```typescript
const {
  currentTurn,           // Current turn number
  availableSnapshots,    // Array of all snapshots
  loadTurnSnapshot,      // Function to load a specific turn
  refreshSnapshots,      // Function to refresh snapshot list
} = useChatsManagement();

// Load turn 3
await loadTurnSnapshot(3);

// Refresh available snapshots
await refreshSnapshots();
```

## Usage Examples

### Example 1: Manual Time Travel

```typescript
// In your React component
const { loadTurnSnapshot, currentTurn, bibleContent, characterContent } = useChatsManagement();

// Show current state
console.log(`Current turn: ${currentTurn}`);
console.log(`Bible length: ${bibleContent.length}`);

// Go back to turn 2
await loadTurnSnapshot(2);

// State is now restored to turn 2
console.log(`Loaded turn 2`);
console.log(`Bible length: ${bibleContent.length}`);
```

### Example 2: Browse Available Snapshots

```typescript
const { refreshSnapshots, availableSnapshots } = useChatsManagement();

// Load all snapshots
await refreshSnapshots();

// Display in UI
availableSnapshots.map(snapshot => (
  <div key={snapshot.turnNumber}>
    Turn {snapshot.turnNumber} - {snapshot.timestamp.toLocaleString()}
    <button onClick={() => loadTurnSnapshot(snapshot.turnNumber)}>
      Load
    </button>
  </div>
));
```

### Example 3: Check if Snapshots Exist

```typescript
const { availableSnapshots, refreshSnapshots } = useChatsManagement();

await refreshSnapshots();

if (availableSnapshots.length > 0) {
  console.log(`Found ${availableSnapshots.length} saved turns`);
  console.log(`Earliest: Turn ${availableSnapshots[0].turnNumber}`);
  console.log(`Latest: Turn ${availableSnapshots[availableSnapshots.length - 1].turnNumber}`);
}
```

## Migration

For existing databases, run the migration script:

```bash
npx tsx scripts/migrate-add-current-turn.ts
```

This safely adds the `current_turn` column without affecting existing data.

## Implementation Details

### Turn Lifecycle

1. **User sends message** → Stored with current phase
2. **Assistant responds** → Stored with current phase
3. **Response complete** → Snapshot saved with current turn
4. **Turn incremented** → Ready for next interaction

### Phase Naming Convention

- `world` - World generation phase
- `character` - Character generation phase
- `turn-0` - Initial snapshot (after character gen)
- `turn-1` - First gameplay turn snapshot
- `turn-2` - Second gameplay turn snapshot
- ... and so on

### Snapshot Timing

Snapshots are saved **after the assistant's response** completes. This ensures:
- ✅ The turn is fully complete
- ✅ Any bible/character updates are captured
- ✅ Consistent snapshot points

### Error Handling

Snapshot failures are **non-blocking**:
- If snapshot save fails, gameplay continues normally
- Error is logged to console
- User experience is not interrupted

## Future Enhancements

Potential additions to the versioning system:

1. **UI for time travel** - Visual timeline with snapshot points
2. **Diff viewer** - Show what changed between turns
3. **Branch points** - Create alternate timelines from any turn
4. **Snapshot metadata** - Store additional context (action taken, etc.)
5. **Automatic pruning** - Archive old snapshots after N turns
6. **Snapshot compression** - Compress large bible/character content

## Technical Benefits

### Why This Approach?

1. **No Breaking Changes** - Uses existing `messages` table
2. **Efficient Storage** - Leverages composite primary key design
3. **Automatic Cleanup** - Cascade delete when chat is deleted
4. **Simple Implementation** - No complex migration or new tables
5. **Backward Compatible** - Existing code continues to work
6. **Flexible Querying** - Can filter by phase or get all

### Performance Considerations

- **Snapshot size**: Typically 5-20KB per snapshot (bible + character)
- **Query performance**: Indexed by phase for fast retrieval
- **Storage growth**: ~10-20KB per turn (reasonable for 100s of turns)
- **Memory usage**: Only current snapshot loaded in memory

## Troubleshooting

### Snapshots not saving

Check console for errors:
```typescript
// Should see logs like:
📸 Snapshot saved for turn 5
📸 Initial snapshot saved (turn 0)
```

### Turn number not incrementing

Verify database was migrated:
```sql
SELECT current_turn FROM chats WHERE id = 'your-chat-id';
```

### Can't load old snapshot

Ensure snapshot exists:
```typescript
const snapshots = await getAllSnapshots(chatId, userId);
console.log(snapshots); // Check if turn exists
```

## Summary

The turn-based versioning system provides:

- ✅ **Automatic snapshots** at each turn
- ✅ **Time-travel support** to any previous turn
- ✅ **Zero breaking changes** to existing code
- ✅ **Efficient storage** using existing tables
- ✅ **Simple API** for loading/saving snapshots

The system is production-ready and can be extended with UI features for a complete time-travel experience.
