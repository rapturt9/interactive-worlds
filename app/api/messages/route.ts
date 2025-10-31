import { NextRequest, NextResponse } from 'next/server';
import { addMessage, updateMessage, deleteMessagesAfter } from '@/lib/db/queries';

// POST add message
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId, message } = body;

    if (!chatId || !message) {
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

    addMessage(chatId, messageWithDate);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json({ error: 'Failed to add message' }, { status: 500 });
  }
}

// PATCH update message
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { messageId, content } = body;

    if (!messageId || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    updateMessage(messageId, content);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

// DELETE messages after a certain message (for regeneration)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const messageId = searchParams.get('messageId');

    if (!chatId || !messageId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    deleteMessagesAfter(chatId, messageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting messages:', error);
    return NextResponse.json({ error: 'Failed to delete messages' }, { status: 500 });
  }
}
