"use client";
import { useEffect, useState } from "react";
import { Plus, TrendingUp, TrendingDown, XCircle, Trash2 } from "lucide-react";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface Entry { id:string; date:string; type:string; category:string; description:string; amount:number; note?:string; }
const INCOME_CATS  = ["ค่าซ่อม","ค่าอะไหล่","ค่าบริการอื่นๆ","รายรับอื่นๆ"];
const EXPENSE_CATS = ["ค่าใช้จ่ายประจำวัน","ซื้ออะไหล่","ค่าน้ำค่าไฟ","ค่าจ้าง","ค่าใช้จ่ายอื่นๆ"];
const EMPTY = { type:"INCOME", category:"ค่าซ่อม", description:"", amount:"", note:"", date: format(new Date(),"yyyy-MM-dd") };

export default function LedgerPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate]       = useState(format(new Date(),"yyyy-MM-dd"));
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  async function load(d: string) {
    setLoading(true);
    const data = await fetch(`/api/ledger?date=${d}`).then(r=>r.json());
    setEntries(data); setLoading(false);
  }
  useEffect(()=>{ load(date); },[date]);

  const income  = entries.filter(e=>e.type==="INCOME").reduce((s,e)=>s+e.amount,0);
  const expense = entries.filter(e=>e.type==="EXPENSE").reduce((s,e)=>s+e.amount,0);
  const net     = income - expense;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch("/api/ledger", { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ...form, amount:Number(form.amount), date: new Date(form.date).toISOString() }) });
    await load(date); setSaving(false); setModal(false);
    setForm({...EMPTY, date});
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    await fetch("/api/ledger", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id }) });
    await load(date);
  }

  const dateLabel = format(new Date(date+"T12:00:00"), "EEEE d MMMM yyyy", { locale:th });

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-stone-800">บัญชีรายวัน</h1><p className="text-sm text-stone-400 capitalize">{dateLabel}</p></div>
        <div className="flex gap-2">
          <input type="date" className="input w-auto" value={date} onChange={e=>setDate(e.target.value)}/>
          <button onClick={()=>{ setForm({...EMPTY,date}); setModal(true); }} className="btn-primary"><Plus className="w-4 h-4"/>บันทึกรายการ</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center"><TrendingUp className="w-4 h-4 text-green-600"/></div><span className="text-sm font-semibold text-stone-600">รายรับ</span></div>
          <p className="text-xl font-bold text-green-700">{formatCurrency(income)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center"><TrendingDown className="w-4 h-4 text-red-600"/></div><span className="text-sm font-semibold text-stone-600">รายจ่าย</span></div>
          <p className="text-xl font-bold text-red-700">{formatCurrency(expense)}</p>
        </div>
        <div className={cn("card", net>=0?"bg-green-50 border-green-200":"bg-red-50 border-red-200")}>
          <div className="flex items-center gap-2 mb-2"><div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", net>=0?"bg-green-100":"bg-red-100")}><span className="font-bold text-lg">{net>=0?"💰":"⚠️"}</span></div><span className="text-sm font-semibold text-stone-600">คงเหลือ</span></div>
          <p className={cn("text-xl font-bold", net>=0?"text-green-700":"text-red-700")}>{formatCurrency(net)}</p>
        </div>
      </div>

      {/* Entry list */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-surface-100 flex items-center justify-between">
          <h3 className="font-bold text-stone-800">รายการทั้งหมด</h3>
          <span className="text-sm text-stone-400">{entries.length} รายการ</span>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{Array(3).fill(0).map((_,i)=><div key={i} className="h-14 bg-surface-100 rounded-xl animate-pulse"/>)}</div>
        ) : entries.length === 0 ? (
          <div className="p-10 text-center text-stone-400"><p className="text-3xl mb-2">📒</p><p>ยังไม่มีรายการวันนี้</p></div>
        ) : (
          <div className="divide-y divide-surface-100">
            {entries.map(entry=>(
              <div key={entry.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-50 transition-colors group">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", entry.type==="INCOME"?"bg-green-100":"bg-red-100")}>
                  {entry.type==="INCOME" ? <TrendingUp className="w-4 h-4 text-green-600"/> : <TrendingDown className="w-4 h-4 text-red-600"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 leading-tight">{entry.description}</p>
                  <p className="text-xs text-stone-400">{entry.category} · {formatDateTime(entry.date)}</p>
                  {entry.note && <p className="text-xs text-stone-500 mt-0.5">{entry.note}</p>}
                </div>
                <p className={cn("font-bold text-lg shrink-0", entry.type==="INCOME"?"text-green-700":"text-red-600")}>
                  {entry.type==="INCOME"?"+":"-"}{formatCurrency(entry.amount)}
                </p>
                <button onClick={()=>handleDelete(entry.id)} className="btn-icon opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setModal(false); }}>
          <div className="modal p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-stone-800">บันทึกรายการ</h2>
              <button onClick={()=>setModal(false)} className="btn-icon"><XCircle className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">ประเภท</label>
                <div className="grid grid-cols-2 gap-2">
                  {[["INCOME","💰 รายรับ"],["EXPENSE","💸 รายจ่าย"]].map(([k,l])=>(
                    <button key={k} type="button" onClick={()=>setForm(f=>({...f,type:k,category:k==="INCOME"?INCOME_CATS[0]:EXPENSE_CATS[0]}))}
                      className={cn("py-2.5 rounded-xl border font-semibold text-sm transition-all", form.type===k ? k==="INCOME"?"bg-green-500 text-white border-green-500":"bg-red-500 text-white border-red-500" : "bg-surface-50 text-stone-600 border-surface-200")}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">หมวดหมู่</label>
                <select className="input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {(form.type==="INCOME"?INCOME_CATS:EXPENSE_CATS).map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">รายละเอียด *</label><input className="input" placeholder="อธิบายรายการ" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} required/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">จำนวนเงิน (บาท) *</label><input type="number" className="input" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required/></div>
                <div><label className="label">วันที่</label><input type="date" className="input" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
              </div>
              <div><label className="label">หมายเหตุ</label><input className="input" placeholder="บันทึกเพิ่มเติม" value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving?"กำลังบันทึก...":"บันทึก"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
