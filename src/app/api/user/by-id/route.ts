import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Falta id" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        workerProfile: {
          select: {
            fullName: true,
            city: true,
            province: true,
            phone: true
          }
        },
        foremanProfile: {
          select: {
            fullName: true,
            city: true,
            province: true,
            phone: true,
            crewSize: true
          }
        },
        companyProfile: {
          select: {
            companyName: true,
            city: true,
            province: true,
            phone: true,
            cif: true,
            isVerified: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user by id:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
