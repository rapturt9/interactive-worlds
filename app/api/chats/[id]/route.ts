import { NextRequest, NextResponse } from 'next/server';
import { getChat } from '@/lib/db/queries';
import { getMessages } from '@/lib/db/queries';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chat = getChat(id);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    const messages = getMessages(id);

    return NextResponse.json({
      ...chat,
      messages,
    });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}
