"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Wrench, Package, FileText, BookOpen, LogOut, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV = [
  { href:"/dashboard", label:"หน้าหลัก",    icon:LayoutDashboard, sub:"ภาพรวมร้าน" },
  { href:"/jobs",      label:"งานซ่อม",      icon:Wrench,          sub:"จัดการงานซ่อม" },
  { href:"/parts",     label:"อะไหล่",       icon:Package,         sub:"คลังอะไหล่" },
  { href:"/invoices",  label:"ใบแจ้งหนี้",   icon:FileText,        sub:"ใบเสร็จ-ค้างชำระ" },
  { href:"/ledger",    label:"บัญชีรายวัน",  icon:BookOpen,        sub:"รายรับ-รายจ่าย" },
];

export default function Sidebar() {
  const path = usePathname();
  const [mini, setMini] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className={cn("hidden lg:flex flex-col bg-white border-r border-surface-200 transition-all duration-300", mini?"w-[72px]":"w-[230px]")}>
        {/* Logo */}
        <div className={cn("flex items-center gap-3 px-4 py-5 border-b border-surface-100", mini&&"justify-center px-2")}>
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5 text-white"/>
          </div>
          {!mini && (
            <div className="min-w-0">
              <p className="font-bold text-stone-800 text-sm truncate">อ่าวนางยานยนต์</p>
              <p className="text-[11px] text-stone-400">Ao Nang Automotive</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({href,label,icon:Icon,sub})=>{
            const active = path===href||(href!=="/dashboard"&&path.startsWith(href));
            return (
              <Link key={href} href={href} title={mini?label:undefined}
                className={cn("flex items-center gap-3 rounded-xl transition-all",
                  mini?"justify-center p-2.5":"px-3 py-2.5",
                  active?"bg-brand-600 text-white shadow-sm":"text-stone-600 hover:bg-surface-100")}>
                <Icon className="w-[18px] h-[18px] shrink-0"/>
                {!mini && (
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-[15px] font-semibold leading-tight", active?"text-white":"text-stone-700")}>{label}</p>
                    <p className={cn("text-[11px] mt-0.5", active?"text-orange-200":"text-stone-400")}>{sub}</p>
                  </div>
                )}
                {!mini&&active&&<ChevronRight className="w-3.5 h-3.5 text-orange-200 shrink-0"/>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-surface-100 space-y-1">
          <button onClick={()=>setMini(!mini)}
            className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-400 hover:bg-surface-100 text-xs transition-all", mini&&"justify-center")}>
            <ChevronRight className={cn("w-4 h-4 transition-transform", !mini&&"rotate-180")}/>
            {!mini&&"ย่อเมนู"}
          </button>
          <button onClick={()=>signOut({callbackUrl:"/login"})}
            className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-xl text-stone-500 text-sm hover:bg-red-50 hover:text-red-600 transition-all", mini&&"justify-center")}>
            <LogOut className="w-4 h-4 shrink-0"/>{!mini&&"ออกจากระบบ"}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-surface-200 flex">
        {NAV.map(({href,label,icon:Icon})=>{
          const active = path===href||(href!=="/dashboard"&&path.startsWith(href));
          return (
            <Link key={href} href={href}
              className={cn("flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors",
                active?"text-brand-600":"text-stone-400")}>
              <Icon className="w-5 h-5"/>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
