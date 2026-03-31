"use client";
import { useEffect, useState } from "react";
import { TrendingUp, Wrench, Package, FileText, CheckCircle, AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency, cn } from "@/lib/utils";
import Link from "next/link";

interface DashData {
  todayRevenue:number; monthRevenue:number; activeJobs:number; pendingJobs:number;
  completedToday:number; lowStockCount:number; unpaidCount:number; unpaidAmount:number;
  revenueChart:{date:string;income:number;expense:number}[];
}
const DAYS = ["อา","จ","อ","พ","พฤ","ศ","ส"];

export default function DashboardPage() {
  const [data, setData]       = useState<DashData|null>(null);
  const [loading, setLoading] = useState(true);
  const [spin, setSpin]       = useState(false);

  async function load() {
    const res = await fetch("/api/dashboard");
    setData(await res.json());
    setLoading(false); setSpin(false);
  }
  useEffect(()=>{ load(); },[]);

  const stats = data ? [
    { label:"รายได้วันนี้",   value:formatCurrency(data.todayRevenue), sub:`เดือนนี้ ${formatCurrency(data.monthRevenue)}`, icon:TrendingUp, color:"bg-green-100 text-green-700", href:"/ledger",   alert:false },
    { label:"กำลังซ่อม",     value:String(data.activeJobs),           sub:`รอดำเนินการ ${data.pendingJobs} งาน`,           icon:Wrench,     color:"bg-blue-100 text-blue-700",  href:"/jobs",     alert:false },
    { label:"อะไหล่ใกล้หมด", value:String(data.lowStockCount),        sub:"รายการที่ต้องสั่งเพิ่ม",                          icon:Package,    color:data.lowStockCount>0?"bg-red-100 text-red-700":"bg-surface-100 text-stone-500", href:"/parts",    alert:data.lowStockCount>0 },
    { label:"ค้างชำระ",      value:String(data.unpaidCount),          sub:formatCurrency(data.unpaidAmount),                icon:FileText,   color:data.unpaidCount>0?"bg-orange-100 text-orange-700":"bg-surface-100 text-stone-500", href:"/invoices", alert:data.unpaidCount>0 },
  ] : [];

  return (
    <div className="space-y-5 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">ภาพรวมร้าน</h1>
          <p className="text-sm text-stone-400 mt-0.5">อ่าวนางยานยนต์ · อ่าวนาง กระบี่</p>
        </div>
        <button onClick={()=>{ setSpin(true); load(); }} className="btn-secondary text-sm">
          <RefreshCw className={cn("w-4 h-4", spin&&"animate-spin")}/> รีเฟรช
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {loading ? Array(4).fill(0).map((_,i)=>(
          <div key={i} className="card"><div className="w-11 h-11 bg-surface-200 rounded-xl animate-pulse mb-3"/><div className="h-7 w-20 bg-surface-200 rounded-lg animate-pulse mb-2"/><div className="h-3 w-28 bg-surface-100 rounded animate-pulse"/></div>
        )) : stats.map(s=>(
          <Link key={s.href} href={s.href} className="card hover:shadow-lift transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center",s.color)}>
                <s.icon className="w-5 h-5"/>
              </div>
              {s.alert&&<span className="flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100"><AlertTriangle className="w-3 h-3"/>ต้องดูแล</span>}
            </div>
            <p className="text-2xl font-bold text-stone-800">{s.value}</p>
            <p className="text-sm font-semibold text-stone-600 mt-0.5">{s.label}</p>
            <p className="text-xs text-stone-400 mt-0.5">{s.sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="font-bold text-stone-800">รายได้-รายจ่าย 7 วัน</h3><p className="text-xs text-stone-400 mt-0.5">ย้อนหลัง 7 วัน</p></div>
            <div className="flex gap-3 text-xs text-stone-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-brand-500"/>รายได้</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-stone-300"/>รายจ่าย</span>
            </div>
          </div>
          {loading ? <div className="h-48 bg-surface-100 rounded-xl animate-pulse"/> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data?.revenueChart} barGap={4} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false}/>
                <XAxis dataKey="date" tickFormatter={v=>DAYS[new Date(v).getDay()]} axisLine={false} tickLine={false} tick={{fontSize:12,fill:"#78716c"}}/>
                <YAxis axisLine={false} tickLine={false} tick={{fontSize:11,fill:"#a8a29e"}} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} width={32}/>
                <Tooltip contentStyle={{borderRadius:12,border:"1px solid #e7e5e4",fontSize:13,fontFamily:"Sarabun"}}
                  formatter={(v:number,n:string)=>[formatCurrency(v),n==="income"?"รายได้":"รายจ่าย"]}
                  labelFormatter={l=>{const d=new Date(l);return `${DAYS[d.getDay()]} ${d.getDate()}/${d.getMonth()+1}`;}}/>
                <Bar dataKey="income" radius={[6,6,0,0]}>
                  {data?.revenueChart.map((_,i)=><Cell key={i} fill={i===(data.revenueChart.length-1)?"#ea580c":"#fdba74"}/>)}
                </Bar>
                <Bar dataKey="expense" fill="#d6d3d1" radius={[6,6,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="font-bold text-stone-800 mb-3">เมนูด่วน</h3>
          <div className="space-y-2">
            {[
              { href:"/jobs",      emoji:"🔧", label:"เปิดงานซ่อมใหม่",   color:"bg-blue-50 text-blue-700 border-blue-100" },
              { href:"/invoices",  emoji:"🧾", label:"สร้างใบแจ้งหนี้",    color:"bg-green-50 text-green-700 border-green-100" },
              { href:"/customers", emoji:"👤", label:"เพิ่มลูกค้าใหม่",    color:"bg-purple-50 text-purple-700 border-purple-100" },
              { href:"/ledger",    emoji:"💰", label:"บันทึกรายรับวันนี้",  color:"bg-orange-50 text-orange-700 border-orange-100" },
              { href:"/parts",     emoji:"📦", label:"ตรวจสต็อกอะไหล่",    color:"bg-stone-50 text-stone-600 border-stone-100" },
            ].map(item=>(
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:shadow-sm active:scale-[0.98]", item.color)}>
                <span>{item.emoji}</span>{item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Today summary */}
      <div className="card">
        <h3 className="font-bold text-stone-800 mb-4">สรุปวันนี้</h3>
        <div className="grid grid-cols-3 divide-x divide-surface-200">
          {loading ? Array(3).fill(0).map((_,i)=>(
            <div key={i} className="px-4 flex flex-col items-center gap-2">
              <div className="h-8 w-16 bg-surface-200 rounded animate-pulse"/>
              <div className="h-3 w-20 bg-surface-100 rounded animate-pulse"/>
            </div>
          )) : [
            { icon:CheckCircle, color:"text-green-500", value:data?.completedToday??0, label:"งานเสร็จวันนี้" },
            { icon:Clock,       color:"text-blue-500",  value:data?.activeJobs??0,     label:"กำลังซ่อม" },
            { icon:AlertTriangle,color:"text-orange-500",value:data?.pendingJobs??0,   label:"รอดำเนินการ" },
          ].map(s=>(
            <div key={s.label} className="px-4 flex flex-col items-center text-center">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={cn("w-4 h-4",s.color)}/>
                <span className="text-2xl font-bold text-stone-800">{s.value}</span>
              </div>
              <p className="text-xs text-stone-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
