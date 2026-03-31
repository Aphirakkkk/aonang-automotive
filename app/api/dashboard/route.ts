import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { startOfDay, startOfMonth, subDays } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);
  const weekAgo    = subDays(now, 6);

  const [todayIncome, monthIncome, activeJobs, pendingJobs, completedToday, lowStock, unpaid, weekEntries] = await Promise.all([
    prisma.ledgerEntry.aggregate({ where:{ type:"INCOME", date:{ gte:todayStart } }, _sum:{ amount:true } }),
    prisma.ledgerEntry.aggregate({ where:{ type:"INCOME", date:{ gte:monthStart } }, _sum:{ amount:true } }),
    prisma.job.count({ where:{ status:"IN_PROGRESS" } }),
    prisma.job.count({ where:{ status:{ in:["PENDING","WAITING_PARTS"] } } }),
    prisma.job.count({ where:{ status:"COMPLETED", completedAt:{ gte:todayStart } } }),
    prisma.part.count({ where:{ stock:{ lte:3 } } }),
    prisma.invoice.aggregate({ where:{ status:"UNPAID" }, _sum:{ total:true }, _count:true }),
    prisma.ledgerEntry.findMany({ where:{ date:{ gte:weekAgo } }, orderBy:{ date:"asc" } }),
  ]);

  const dayMap: Record<string, { income:number; expense:number }> = {};
  for (let i=6; i>=0; i--) {
    const k = subDays(now,i).toISOString().split("T")[0];
    dayMap[k] = { income:0, expense:0 };
  }
  for (const e of weekEntries) {
    const k = e.date.toISOString().split("T")[0];
    if (dayMap[k]) { if(e.type==="INCOME") dayMap[k].income+=e.amount; else dayMap[k].expense+=e.amount; }
  }

  return NextResponse.json({
    todayRevenue: todayIncome._sum.amount ?? 0,
    monthRevenue: monthIncome._sum.amount ?? 0,
    activeJobs, pendingJobs, completedToday,
    lowStockCount: lowStock,
    unpaidCount: unpaid._count,
    unpaidAmount: unpaid._sum.total ?? 0,
    revenueChart: Object.entries(dayMap).map(([date,v])=>({ date,...v })),
  });
}
