import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(",") || [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ isAdmin: false }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { role: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ isAdmin: false });
    }

    // Es admin si tiene rol ADMIN o su email está en la lista de admins
    const isAdmin = user.role === "ADMIN" || ADMIN_EMAILS.includes(user.email);

    return NextResponse.json({ isAdmin });
  } catch (error) {
    console.error("Error checking admin:", error);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
