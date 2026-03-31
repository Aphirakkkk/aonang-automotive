import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const invoices = await prisma.invoice.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`;
    const { items, ...rest } = body;
    const invoice = await prisma.invoice.create({
      data: { ...rest, invoiceNumber, items: { create: items } },
      include: { items: true },
    });
    return NextResponse.json(invoice);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}