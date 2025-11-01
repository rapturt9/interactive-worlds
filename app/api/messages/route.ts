import { NextRequest, NextResponse } from 'next/server';
import { addMessage, updateMessage, deleteMessagesAfter } from '@/lib/db/queries';
import { getUserId } from '@/lib/auth/user-id';

// POST add message
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { chatId, message } = body;

    console.log('💾 [POST /api/messages] Adding message:', {
      chatId,
      messageId: message?.id,
      role: message?.role,
      phase: message?.phase || 'NOT SET',
      contentLength: message?.content?.length || 0,
      contentPreview: message?.content?.substring(0, 100),
    });

    if (!chatId || !message) {
      console.error('❌ [POST /api/messages] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert timestamp string to Date if needed
    const messageWithDate = {
      ...message,
      timestamp: message.timestamp instanceof Date
        ? message.timestamp
        : new Date(message.timestamp),
    };

    await addMessage(chatId, userId, messageWithDate);
    console.log('✅ [POST /api/messages] Message saved successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/messages] Error adding message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}

// PATCH update message
export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId();
    const body = await req.json();
    const { messageId, content } = body;

    if (!messageId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await updateMessage(messageId, userId, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

// DELETE messages after a certain message (for regeneration)
export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const messageId = searchParams.get('messageId');

    if (!chatId || !messageId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    await deleteMessagesAfter(chatId, userId, messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting messages:', error);
    return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
  }
}
