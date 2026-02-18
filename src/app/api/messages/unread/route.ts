import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  try {
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Error counting unread messages:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
