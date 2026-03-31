"use client";
import { Bell, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function TopBar({ user }: { user: { name?: string|null; email?: string|null } }) {
  return (
    <header className="bg-white border-b border-surface-200 px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-base font-bold text-stone-800">สวัสดี, {user?.name ?? "คุณ"} 👋</h2>
        <p className="text-xs text-stone-400">{formatDate(new Date())}</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-icon relative"><Bell className="w-4 h-4"/></button>
        <div className="flex items-center gap-2 pl-2">
          <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center"><User className="w-4 h-4 text-brand-600"/></div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-stone-700 leading-tight">{user?.name}</p>
            <p className="text-[11px] text-stone-400">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
