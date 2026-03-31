import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data: body,
    include: { customer: { select: { id: true, name: true, phone: true } }, items: true },
  });
  return NextResponse.json(invoice);
}
