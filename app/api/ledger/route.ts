import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const where = date ? { date: { gte: startOfDay(new Date(date)), lte: endOfDay(new Date(date)) } } : {};
  const entries = await prisma.ledgerEntry.findMany({ where, orderBy: { date: "desc" } });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const entry = await prisma.ledgerEntry.create({ data: { ...body, date: new Date(body.date) } });
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.ledgerEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
