import { NextRequest, NextResponse } from 'next/server';
import {
  saveTurnSnapshot,
  loadTurnSnapshot,
  getCurrentTurn,
  incrementTurn,
  getAllSnapshots,
  getChat,
} from '@/lib/db/queries';
import { getUserId } from '@/lib/auth/user-id';

// POST - Save a snapshot for the current turn
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json(
        { error: 'Missing chatId' },
        { status: 400 }
      );
    }

    console.log('📸 [POST /api/snapshots] Saving snapshot for chat:', chatId);

    // Get current chat data (bible and character)
    const chat = await getChat(chatId, userId);
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Get current turn
    const currentTurn = await getCurrentTurn(chatId, userId);

    // Save snapshot
    await saveTurnSnapshot(
      chatId,
      userId,
      currentTurn,
      chat.bibleContent || '',
      chat.characterContent || ''
    );

    console.log(`✅ [POST /api/snapshots] Snapshot saved for turn ${currentTurn}`);

    // Increment turn for next interaction
    const newTurn = await incrementTurn(chatId, userId);

    return NextResponse.json({
      success: true,
      turnNumber: currentTurn,
      nextTurn: newTurn,
    });
  } catch (error) {
    console.error('[POST /api/snapshots] Error saving snapshot:', error);
    return NextResponse.json({ error: 'Failed to save snapshot' }, { status: 500 });
  }
}

// GET - Load a snapshot or get all snapshots
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const turnNumber = searchParams.get('turn');

    if (!chatId) {
      return NextResponse.json(
        { error: 'Missing chatId' },
        { status: 400 }
      );
    }

    // If turnNumber provided, load specific snapshot
    if (turnNumber !== null) {
      const turn = parseInt(turnNumber, 10);
      const snapshot = await loadTurnSnapshot(chatId, userId, turn);

      if (!snapshot) {
        return NextResponse.json(
          { error: 'Snapshot not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ snapshot });
    }

    // Otherwise, return all snapshots
    const snapshots = await getAllSnapshots(chatId, userId);
    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error('[GET /api/snapshots] Error loading snapshot:', error);
    return NextResponse.json({ error: 'Failed to load snapshot' }, { status: 500 });
  }
}
