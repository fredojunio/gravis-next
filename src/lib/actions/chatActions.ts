'use server';

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { ChatSession, Message, BuilderData } from "@/types";

export async function getChatSessions() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const dbSessions = await prisma.chatSession.findMany({
        where: { userId: session.user.id },
        include: { messages: true },
        orderBy: { timestamp: 'desc' }
    });

    return dbSessions.map((s: any) => ({
        id: s.id,
        title: s.title,
        timestamp: s.timestamp.getTime(),
        messages: s.messages.map((m: any) => ({
            id: m.id,
            role: m.role as 'user' | 'model',
            text: m.text,
            images: m.images,
            groundingUrls: m.groundingUrls as any
        })),
        builderData: s.builderData as any as BuilderData
    }));
}

export async function createChatSession(title: string, builderData: BuilderData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const dbSession = await prisma.chatSession.create({
        data: {
            title,
            userId: session.user.id,
            builderData: builderData as any
        }
    });

    return dbSession.id;
}

export async function addMessageToSession(sessionId: string, message: Message) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.message.create({
        data: {
            role: message.role,
            text: message.text,
            images: message.images || [],
            groundingUrls: message.groundingUrls as any || [],
            sessionId: sessionId
        }
    });
}

export async function updateSessionTitle(sessionId: string, title: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.chatSession.update({
        where: { id: sessionId, userId: session.user.id },
        data: { title }
    });
}

export async function deleteChatSession(sessionId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.chatSession.delete({
        where: { id: sessionId, userId: session.user.id }
    });
}

export async function saveBuilderData(sessionId: string, builderData: BuilderData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.chatSession.update({
        where: { id: sessionId, userId: session.user.id },
        data: { builderData: builderData as any }
    });
}
