import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { companyId, verify, userId } = body;

  if (!companyId) {
    return NextResponse.json({ error: "Falta companyId" }, { status: 400 });
  }

  try {
    await prisma.companyProfile.update({
      where: { id: companyId },
      data: {
        isVerified: verify,
        verifiedAt: verify ? new Date() : null,
        verifiedBy: verify ? userId : null,
      },
    });

    // Crear log
    await prisma.adminLog.create({
      data: {
        adminId: userId,
        action: verify ? "VERIFY_COMPANY" : "UNVERIFY_COMPANY",
        targetType: "COMPANY",
        targetId: companyId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error verifying company:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
