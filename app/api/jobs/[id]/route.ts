import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    // ถ้าเปลี่ยนสถานะเป็น COMPLETED → ตัดสต็อกอะไหล่
    if (body.status === "COMPLETED") {
      const existing = await prisma.job.findUnique({
        where: { id: params.id },
        include: { usedParts: true },
      });
      if (existing && existing.status !== "COMPLETED" && existing.usedParts.length > 0) {
        for (const up of existing.usedParts) {
          const part = await prisma.part.findUnique({ where: { id: up.partId } });
          if (part) {
            await prisma.part.update({
              where: { id: up.partId },
              data: { stock: Math.max(0, part.stock - up.quantity) },
            });
          }
        }
      }
    }

    const job = await prisma.job.update({
      where: { id: params.id },
      data: body,
      include: {
        usedParts: {
          include: { part: { select: { id:true, name:true, unit:true, sellPrice:true } } }
        }
      },
    });
    return NextResponse.json(job);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await prisma.job.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
