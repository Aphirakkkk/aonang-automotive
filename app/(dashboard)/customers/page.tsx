"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Phone, MapPin, XCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Customer {
  id:string; name:string; phone:string; lineId?:string;
  address?:string; note?:string; createdAt:string;
  _count: { invoices:number };
}
const EMPTY = { name:"", phone:"", lineId:"", address:"", note:"" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<Customer|null>(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);

  async function load() {
    try {
      const c = await fetch("/api/customers").then(r=>r.json());
      setCustomers(Array.isArray(c) ? c : []);
    } catch { setCustomers([]); }
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const filtered = customers.filter(c =>
    c.name.includes(search) || c.phone.includes(search) || (c.address??'').includes(search)
  );

  function openEdit(c: Customer) {
    setEditing(c);
    setForm({ name:c.name, phone:c.phone, lineId:c.lineId??"", address:c.address??"", note:c.note??"" });
    setModal(true);
  }
  function openAdd() { setEditing(null); setForm(EMPTY); setModal(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    if (editing) await fetch(`/api/customers/${editing.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    else await fetch("/api/customers", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    await load(); setSaving(false); setModal(false);
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-stone-800">ลูกค้า</h1><p className="text-sm text-stone-400">ทั้งหมด {customers.length} คน</p></div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4"/>เพิ่มลูกค้าใหม่</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"/>
        <input className="input pl-10" placeholder="ค้นหาชื่อ เบอร์โทร ที่อยู่..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {loading ? Array(6).fill(0).map((_,i)=>(
          <div key={i} className="card"><div className="h-5 w-32 bg-surface-200 rounded animate-pulse mb-2"/><div className="h-4 w-24 bg-surface-100 rounded animate-pulse"/></div>
        )) : filtered.length === 0 ? (
          <div className="col-span-3 text-center py-16 text-stone-400">
            <p className="text-4xl mb-2">👥</p>
            <p>ยังไม่มีลูกค้า</p>
          </div>
        ) : filtered.map(c=>(
          <div key={c.id} className="card hover:shadow-lift transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 bg-brand-100 rounded-xl flex items-center justify-center text-xl font-bold text-brand-700">
                {c.name.charAt(0)}
              </div>
              <button onClick={()=>openEdit(c)} className="btn-ghost text-xs py-1 px-3">แก้ไข</button>
            </div>
            <h3 className="font-bold text-stone-800 text-lg leading-tight">{c.name}</h3>
            <div className="flex items-center gap-1.5 text-stone-500 text-sm mt-1">
              <Phone className="w-3.5 h-3.5 shrink-0"/>{c.phone}
            </div>
            {c.address && (
              <div className="flex items-center gap-1.5 text-stone-400 text-xs mt-1">
                <MapPin className="w-3 h-3 shrink-0"/>{c.address}
              </div>
            )}
            {c.lineId && <p className="text-xs text-stone-400 mt-1">LINE: {c.lineId}</p>}
            {c.note   && <p className="text-xs text-stone-500 mt-2 bg-surface-50 rounded-lg px-3 py-2">{c.note}</p>}
            <div className="flex gap-3 mt-3 pt-3 border-t border-surface-100">
              <div className="text-center flex-1">
                <p className="text-lg font-bold text-stone-800">{c._count.invoices}</p>
                <p className="text-xs text-stone-400">ใบแจ้งหนี้</p>
              </div>
              <div className="w-px bg-surface-200"/>
              <div className="text-center flex-1">
                <p className="text-xs font-medium text-stone-600">{formatDate(c.createdAt)}</p>
                <p className="text-xs text-stone-400">เข้าระบบ</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setModal(false); }}>
          <div className="modal p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-stone-800">{editing?"แก้ไขข้อมูลลูกค้า":"เพิ่มลูกค้าใหม่"}</h2>
              <button onClick={()=>setModal(false)} className="btn-icon"><XCircle className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="label">ชื่อ-นามสกุล *</label><input className="input" placeholder="สมชาย ใจดี" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
              <div><label className="label">เบอร์โทร *</label><input className="input" placeholder="081-2345678" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} required/></div>
              <div><label className="label">LINE ID</label><input className="input" placeholder="somchai_line" value={form.lineId} onChange={e=>setForm(f=>({...f,lineId:e.target.value}))}/></div>
              <div><label className="label">ที่อยู่</label><input className="input" placeholder="อ่าวนาง กระบี่" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></div>
              <div><label className="label">หมายเหตุ</label><textarea className="input" rows={2} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/></div>
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
