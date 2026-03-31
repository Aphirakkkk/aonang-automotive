import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const jobs = await prisma.job.findMany({
      where: status ? { status: status as never } : undefined,
      include: {
        usedParts: {
          include: { part: { select: { id:true, name:true, unit:true, sellPrice:true } } }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(jobs);
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
    const { usedParts, ...jobData } = body;

    const count = await prisma.job.count();
    const jobNumber = `JOB-${String(count + 1).padStart(3, "0")}`;

    const job = await prisma.job.create({
      data: {
        jobNumber,
        vehicleLabel:   jobData.vehicleLabel,
        ownerName:      jobData.ownerName      || null,
        ownerPhone:     jobData.ownerPhone     || null,
        description:    jobData.description,
        status:         jobData.status         || "PENDING",
        priority:       jobData.priority       || "NORMAL",
        estimatedCost:  Number(jobData.estimatedCost) || 0,
        technicianNote: jobData.technicianNote || null,
        usedParts: usedParts?.length > 0 ? {
          create: usedParts.map((p: { partId:string; quantity:number; unitPrice:number }) => ({
            partId:    p.partId,
            quantity:  p.quantity,
            unitPrice: p.unitPrice,
          }))
        } : undefined,
      },
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
