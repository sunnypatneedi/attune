'use server';

import { getDb } from '@/lib/db';
import { conversations, messages } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function createConversation(title?: string) {
  const db = getDb();
  const id = uuidv4();
  const now = new Date();

  db.insert(conversations)
    .values({
      id,
      title: title ?? 'New conversation',
      createdAt: now,
      updatedAt: now,
    })
    .run();

  revalidatePath('/chat');
  return { id, title: title ?? 'New conversation', updatedAt: now };
}

export async function getConversations() {
  const db = getDb();
  return db
    .select({
      id: conversations.id,
      title: conversations.title,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .orderBy(desc(conversations.updatedAt))
    .all();
}

export async function renameConversation(id: string, title: string) {
  const db = getDb();
  db.update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(conversations.id, id))
    .run();

  revalidatePath('/chat');
}

export async function deleteConversation(id: string) {
  const db = getDb();
  db.delete(conversations).where(eq(conversations.id, id)).run();
  revalidatePath('/chat');
}

export async function getMessages(conversationId: string) {
  const db = getDb();
  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .all();
}

export async function createMessage(data: {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status?: 'streaming' | 'complete' | 'error';
}) {
  const db = getDb();
  const id = uuidv4();
  const now = new Date();

  db.insert(messages)
    .values({
      id,
      conversationId: data.conversationId,
      role: data.role,
      content: data.content,
      status: data.status ?? 'complete',
      createdAt: now,
    })
    .run();

  // Update conversation timestamp
  db.update(conversations)
    .set({ updatedAt: now })
    .where(eq(conversations.id, data.conversationId))
    .run();

  return { id, createdAt: now };
}

export async function generateTitle(conversationId: string, firstMessage: string) {
  // Simple title generation from first message
  const title = firstMessage.length > 50
    ? firstMessage.slice(0, 47) + '...'
    : firstMessage;

  const db = getDb();
  db.update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(eq(conversations.id, conversationId))
    .run();

  revalidatePath('/chat');
  return title;
}
