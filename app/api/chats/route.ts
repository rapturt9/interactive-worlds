import { NextRequest, NextResponse } from 'next/server';
import { getAllChats, createChat, deleteChat, updateChat } from '@/lib/db/queries';
import { getUserId } from '@/lib/auth/user-id';

// GET all chats
export async function GET() {
  try {
    const userId = await getUserId();
    const chats = await getAllChats(userId);
    return NextResponse.json(chats);
  } catch (error) {
    console.error('[GET /api/chats] Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

// POST create new chat
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { id, title, modelTier, worldParams } = body;

    if (!id || !title || !modelTier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await createChat({ id, userId, title, modelTier, worldParams });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[POST /api/chats] Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}

// PATCH update chat
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { id, title, bibleContent, characterContent, conversationState, generationPhase, originalBibleContent } = body;

    if (!id) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    await updateChat(id, userId, { title, bibleContent, characterContent, conversationState, generationPhase, originalBibleContent });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
  }
}

// DELETE chat
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    await deleteChat(id, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}
