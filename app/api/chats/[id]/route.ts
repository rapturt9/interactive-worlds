import { NextRequest, NextResponse } from 'next/server';
import { getChat, getMessages } from '@/lib/db/queries';
import { getUserId } from '@/lib/auth/user-id';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    const chat = await getChat(id, userId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const messages = await getMessages(id, userId);

    console.log(`[Chat loaded] ${chat.title} - ${messages.length} messages`);
    console.log('[Chat messages from DB]:', messages.map((m) => ({
      id: m.id,
      role: m.role,
      contentLength: m.content?.length || 0,
      contentPreview: m.content?.substring(0, 100),
      timestamp: m.timestamp,
    })));

    return NextResponse.json({
      ...chat,
      messages,
    });
  } catch (error) {
    console.error(`[GET /api/chats] Error fetching chat:`, error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}
