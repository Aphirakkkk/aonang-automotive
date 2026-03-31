"use client";
import { useEffect, useState } from "react";
import { Plus, Search, Wrench, Clock, Package, CheckCircle, XCircle, Phone, ChevronLeft, ChevronRight, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { cn, formatDate, formatCurrency, JOB_STATUS_LABEL, JOB_STATUS_COLOR, PRIORITY_LABEL, PRIORITY_COLOR } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";
import { th } from "date-fns/locale";

interface Part { id:string; code:string; name:string; unit:string; sellPrice:number; stock:number; }
interface UsedPart { partId:string; part:{ id:string; name:string; unit:string; sellPrice:number }; quantity:number; unitPrice:number; }
interface Job {
  id:string; jobNumber:string; vehicleLabel:string; ownerName?:string; ownerPhone?:string;
  description:string; status:string; priority:string; estimatedCost:number; actualCost:number;
  technicianNote?:string; startDate?:string; completedAt?:string; createdAt:string;
  usedParts?: UsedPart[];
}

const STATUSES = [
  { key:"PENDING",       label:"รอดำเนินการ", icon:Clock,       color:"text-yellow-600 bg-yellow-50 border-yellow-200" },
  { key:"IN_PROGRESS",   label:"กำลังซ่อม",   icon:Wrench,      color:"text-blue-600 bg-blue-50 border-blue-200" },
  { key:"WAITING_PARTS", label:"รออะไหล่",    icon:Package,     color:"text-purple-600 bg-purple-50 border-purple-200" },
  { key:"COMPLETED",     label:"เสร็จแล้ว",   icon:CheckCircle, color:"text-green-600 bg-green-50 border-green-200" },
];

const EMPTY = { vehicleLabel:"", ownerName:"", ownerPhone:"", description:"", status:"PENDING", priority:"NORMAL", estimatedCost:"", technicianNote:"" };
type SelectedPart = { partId:string; name:string; unit:string; quantity:number; unitPrice:number; stock:number; };

export default function JobsPage() {
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [parts, setParts]         = useState<Part[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [view, setView]           = useState<"kanban"|"table">("kanban");
  const [addModal, setAddModal]   = useState(false);
  const [detailJob, setDetailJob] = useState<Job|null>(null);
  const [editMode, setEditMode]   = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editForm, setEditForm]   = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterMode, setFilterMode]     = useState<"month"|"all">("month");

  // อะไหล่
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([]);
  const [partSearch, setPartSearch]       = useState("");
  const [showPartList, setShowPartList]   = useState(false);

  async function load() {
    try {
      const [j, p] = await Promise.all([
        fetch("/api/jobs").then(r=>r.json()),
        fetch("/api/parts").then(r=>r.json()),
      ]);
      setJobs(Array.isArray(j) ? j : []);
      setParts(Array.isArray(p) ? p : []);
    } catch { setJobs([]); setParts([]); }
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const monthFiltered = filterMode==="all" ? jobs : jobs.filter(j=>{
    const d = new Date(j.createdAt);
    return d >= startOfMonth(currentMonth) && d <= endOfMonth(currentMonth);
  });

  const filtered = monthFiltered.filter(j=>
    j.vehicleLabel.includes(search) ||
    (j.ownerName??'').includes(search) ||
    (j.ownerPhone??'').includes(search) ||
    j.jobNumber.includes(search) ||
    j.description.includes(search)
  );

  const stats = {
    total:     monthFiltered.length,
    completed: monthFiltered.filter(j=>j.status==="COMPLETED").length,
    revenue:   monthFiltered.filter(j=>j.status==="COMPLETED").reduce((s,j)=>s+(j.actualCost||j.estimatedCost),0),
  };

  const partsTotal = selectedParts.reduce((s,p)=>s+(p.unitPrice*p.quantity),0);

  const filteredParts = parts.filter(p=>
    (p.name.includes(partSearch)||p.code.includes(partSearch)) &&
    !selectedParts.find(sp=>sp.partId===p.id)
  ).slice(0,8);

  function addPart(part: Part) {
    setSelectedParts(prev=>[...prev,{ partId:part.id, name:part.name, unit:part.unit, quantity:1, unitPrice:part.sellPrice, stock:part.stock }]);
    setPartSearch(""); setShowPartList(false);
  }
  function removePart(partId: string) { setSelectedParts(prev=>prev.filter(p=>p.partId!==partId)); }
  function updatePartQty(partId: string, qty: number) { setSelectedParts(prev=>prev.map(p=>p.partId===partId?{...p,quantity:Math.max(1,qty)}:p)); }

  function openDetail(job: Job) { setDetailJob(job); setEditMode(false); }
  function openEdit(job: Job) {
    setEditForm({ vehicleLabel:job.vehicleLabel, ownerName:job.ownerName??"", ownerPhone:job.ownerPhone??"", description:job.description, status:job.status, priority:job.priority, estimatedCost:String(job.estimatedCost), technicianNote:job.technicianNote??"" });
    setEditMode(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault(); if(!detailJob) return; setSaving(true);
    await fetch(`/api/jobs/${detailJob.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...editForm,estimatedCost:Number(editForm.estimatedCost)}) });
    await load(); setSaving(false); setEditMode(false); setDetailJob(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const insufficient = selectedParts.filter(p=>p.quantity>p.stock);
    if (insufficient.length>0) {
      const names = insufficient.map(p=>`${p.name} (มี ${p.stock} ${p.unit})`).join(", ");
      if (!confirm(`⚠️ อะไหล่ไม่เพียงพอ:\n${names}\n\nต้องการบันทึกต่อไหม?`)) { setSaving(false); return; }
    }
    await fetch("/api/jobs", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ...form, estimatedCost:Number(form.estimatedCost)||partsTotal, usedParts:selectedParts.map(p=>({partId:p.partId,quantity:p.quantity,unitPrice:p.unitPrice})) }),
    });
    await load(); setSaving(false); setAddModal(false); setForm(EMPTY); setSelectedParts([]); setPartSearch("");
  }

  async function updateStatus(id: string, status: string) {
    const data: Record<string,unknown> = { status };
    if (status==="IN_PROGRESS") data.startDate   = new Date().toISOString();
    if (status==="COMPLETED")   data.completedAt = new Date().toISOString();
    await fetch(`/api/jobs/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
    await load();
    setDetailJob(prev=>prev?.id===id?{...prev,status}:prev);
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบงานซ่อมนี้?")) return;
    await fetch(`/api/jobs/${id}`,{method:"DELETE"}); await load(); setDetailJob(null);
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-stone-800">งานซ่อม</h1><p className="text-sm text-stone-400">ทั้งหมด {jobs.length} งาน</p></div>
        <div className="flex gap-2">
          <div className="flex bg-surface-100 rounded-xl p-1 border border-surface-200">
            {(["kanban","table"] as const).map(v=>(
              <button key={v} onClick={()=>setView(v)} className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all",view===v?"bg-white shadow-sm text-stone-800":"text-stone-500")}>
                {v==="kanban"?"Kanban":"ตาราง"}
              </button>
            ))}
          </div>
          <button onClick={()=>setAddModal(true)} className="btn-primary"><Plus className="w-4 h-4"/>เปิดงานใหม่</button>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex bg-surface-100 rounded-xl p-1 border border-surface-200">
            <button onClick={()=>setFilterMode("month")} className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all",filterMode==="month"?"bg-white shadow-sm text-stone-800":"text-stone-500")}>รายเดือน</button>
            <button onClick={()=>setFilterMode("all")} className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-all",filterMode==="all"?"bg-white shadow-sm text-stone-800":"text-stone-500")}>ทั้งหมด</button>
          </div>
          {filterMode==="month" && (
            <div className="flex items-center gap-2">
              <button onClick={()=>setCurrentMonth(m=>subMonths(m,1))} className="btn-icon"><ChevronLeft className="w-4 h-4"/></button>
              <span className="font-semibold text-stone-800 min-w-[140px] text-center capitalize">{format(currentMonth,"MMMM yyyy",{locale:th})}</span>
              <button onClick={()=>setCurrentMonth(m=>addMonths(m,1))} className="btn-icon" disabled={currentMonth>=new Date()}><ChevronRight className="w-4 h-4"/></button>
            </div>
          )}
          <div className="flex gap-4 text-sm">
            <div className="text-center"><p className="font-bold text-stone-800 text-lg">{stats.total}</p><p className="text-stone-400 text-xs">{filterMode==="month"?"งานเดือนนี้":"งานทั้งหมด"}</p></div>
            <div className="w-px bg-surface-200"/>
            <div className="text-center"><p className="font-bold text-green-700 text-lg">{stats.completed}</p><p className="text-stone-400 text-xs">เสร็จแล้ว</p></div>
            <div className="w-px bg-surface-200"/>
            <div className="text-center"><p className="font-bold text-brand-700 text-lg">{formatCurrency(stats.revenue)}</p><p className="text-stone-400 text-xs">รายได้</p></div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"/>
        <input className="input pl-10" placeholder="ค้นหา เช่น เวฟ ดำ, ฟีโน่, สมชาย..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {/* Kanban */}
      {view==="kanban" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUSES.map(({key,label,icon:Icon,color})=>{
            const cols = filtered.filter(j=>j.status===key);
            return (
              <div key={key} className="bg-surface-50 rounded-2xl border border-surface-200 p-3">
                <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border mb-3",color)}>
                  <Icon className="w-4 h-4"/><span className="font-semibold text-sm">{label}</span>
                  <span className="ml-auto text-xs font-bold">{cols.length}</span>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {loading ? <div className="h-20 bg-surface-200 rounded-xl animate-pulse"/>
                  : cols.length===0 ? <p className="text-center text-xs text-stone-300 py-4">ไม่มีงาน</p>
                  : cols.map(job=>(
                    <button key={job.id} onClick={()=>openDetail(job)}
                      className="w-full text-left bg-white rounded-xl border border-surface-200 p-3 hover:shadow-lift hover:border-brand-300 transition-all active:scale-[0.98]">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-mono text-stone-400">{job.jobNumber}</span>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",PRIORITY_COLOR[job.priority])}>{PRIORITY_LABEL[job.priority]}</span>
                      </div>
                      <p className="font-bold text-stone-800 text-base leading-tight">{job.vehicleLabel}</p>
                      {job.ownerName && <p className="text-xs text-stone-500 mt-0.5">👤 {job.ownerName}</p>}
                      {job.ownerPhone && <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/>{job.ownerPhone}</p>}
                      <p className="text-xs text-stone-600 mt-2 line-clamp-2 border-t border-surface-100 pt-2">{job.description}</p>
                      {job.usedParts && job.usedParts.length>0 && <p className="text-xs text-purple-600 mt-1">🔩 อะไหล่ {job.usedParts.length} รายการ</p>}
                      {job.estimatedCost>0 && <p className="text-xs font-semibold text-brand-600 mt-1">{formatCurrency(job.estimatedCost)}</p>}
                      <p className="text-[10px] text-stone-300 mt-1">{formatDate(job.createdAt)}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      {view==="table" && (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>เลขงาน</th><th>รถ / เจ้าของ</th><th>รายการซ่อม</th><th>อะไหล่</th><th>สถานะ</th><th>ราคาประเมิน</th><th>วันที่</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-8 text-stone-400">กำลังโหลด...</td></tr>
              : filtered.length===0 ? <tr><td colSpan={7} className="text-center py-10 text-stone-300"><p className="text-3xl mb-2">🔧</p><p>ไม่มีงานในช่วงนี้</p></td></tr>
              : filtered.map(job=>(
                <tr key={job.id} onClick={()=>openDetail(job)} className="cursor-pointer">
                  <td><span className="font-mono text-xs text-stone-500">{job.jobNumber}</span></td>
                  <td><p className="font-bold text-stone-800">{job.vehicleLabel}</p>{job.ownerName&&<p className="text-xs text-stone-500">👤 {job.ownerName}</p>}{job.ownerPhone&&<p className="text-xs text-stone-400 flex items-center gap-1"><Phone className="w-3 h-3"/>{job.ownerPhone}</p>}</td>
                  <td><p className="text-sm line-clamp-2">{job.description}</p></td>
                  <td>{job.usedParts&&job.usedParts.length>0?<span className="text-xs text-purple-600">🔩 {job.usedParts.length} รายการ</span>:<span className="text-xs text-stone-300">-</span>}</td>
                  <td><span className={cn("badge",JOB_STATUS_COLOR[job.status])}>{JOB_STATUS_LABEL[job.status]}</span></td>
                  <td>{job.estimatedCost>0?formatCurrency(job.estimatedCost):"-"}</td>
                  <td className="text-xs text-stone-400">{formatDate(job.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Add Modal ===== */}
      {addModal && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget){ setAddModal(false); setForm(EMPTY); setSelectedParts([]); } }}>
          <div className="modal p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-stone-800">เปิดงานซ่อมใหม่</h2>
              <button onClick={()=>{ setAddModal(false); setForm(EMPTY); setSelectedParts([]); }} className="btn-icon"><XCircle className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">รถ / ชื่องาน *</label>
                <input className="input text-lg font-semibold" placeholder="เช่น เวฟ ดำ, ฟีโน่ แดง" value={form.vehicleLabel} onChange={e=>setForm(f=>({...f,vehicleLabel:e.target.value}))} required autoFocus/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">ชื่อเจ้าของ</label><input className="input" placeholder="สมชาย" value={form.ownerName} onChange={e=>setForm(f=>({...f,ownerName:e.target.value}))}/></div>
                <div><label className="label">เบอร์โทร</label><input className="input" placeholder="081-xxx-xxxx" value={form.ownerPhone} onChange={e=>setForm(f=>({...f,ownerPhone:e.target.value}))}/></div>
              </div>
              <div><label className="label">รายการซ่อม *</label><textarea className="input" rows={2} placeholder="เช่น เปลี่ยนน้ำมัน ผ้าเบรกหน้า" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} required/></div>

              {/* เลือกอะไหล่ */}
              <div>
                <label className="label">อะไหล่ที่ใช้ <span className="text-stone-400 font-normal">(ไม่บังคับ)</span></label>
                <div className="relative">
                  <input className="input" placeholder="พิมพ์ค้นหาอะไหล่ เช่น ผ้าเบรก, น้ำมัน..."
                    value={partSearch} onChange={e=>{ setPartSearch(e.target.value); setShowPartList(true); }}
                    onFocus={()=>setShowPartList(true)}/>
                  {showPartList && partSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-surface-200 rounded-2xl shadow-lift overflow-hidden max-h-48 overflow-y-auto">
                      {filteredParts.length===0
                        ? <p className="text-center text-stone-400 text-sm py-3">ไม่พบอะไหล่</p>
                        : filteredParts.map(part=>(
                          <button key={part.id} type="button" onClick={()=>addPart(part)}
                            className="w-full text-left px-4 py-2.5 hover:bg-surface-50 border-b border-surface-100 last:border-0 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-stone-800 text-sm">{part.name}</p>
                                <p className="text-xs text-stone-400">{part.code} · {formatCurrency(part.sellPrice)}/{part.unit}</p>
                              </div>
                              <div className="text-right">
                                <p className={cn("text-xs font-bold",part.stock<=3?"text-red-600":"text-green-700")}>{part.stock} {part.unit}</p>
                                {part.stock<=3&&<p className="text-[10px] text-red-400">ใกล้หมด</p>}
                              </div>
                            </div>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
                {selectedParts.length>0 && (
                  <div className="mt-2 space-y-2">
                    {selectedParts.map(p=>(
                      <div key={p.partId} className="flex items-center gap-2 bg-surface-50 rounded-xl px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-stone-800 truncate">{p.name}</p>
                          <p className="text-xs text-stone-400">{formatCurrency(p.unitPrice)}/{p.unit} · มีในสต็อก {p.stock} {p.unit}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button type="button" onClick={()=>updatePartQty(p.partId,p.quantity-1)} className="w-6 h-6 rounded-lg bg-surface-200 text-stone-600 font-bold hover:bg-surface-300 flex items-center justify-center text-sm">-</button>
                          <span className="w-8 text-center font-bold text-stone-800 text-sm">{p.quantity}</span>
                          <button type="button" onClick={()=>updatePartQty(p.partId,p.quantity+1)} className="w-6 h-6 rounded-lg bg-surface-200 text-stone-600 font-bold hover:bg-surface-300 flex items-center justify-center text-sm">+</button>
                        </div>
                        <p className="text-sm font-bold text-brand-700 min-w-[60px] text-right">{formatCurrency(p.unitPrice*p.quantity)}</p>
                        {p.quantity>p.stock&&<AlertTriangle className="w-4 h-4 text-red-500 shrink-0"/>}
                        <button type="button" onClick={()=>removePart(p.partId)} className="text-stone-300 hover:text-red-400"><XCircle className="w-4 h-4"/></button>
                      </div>
                    ))}
                    <div className="flex justify-between px-3 py-2 bg-brand-50 rounded-xl">
                      <span className="text-sm font-semibold text-brand-700">รวมค่าอะไหล่</span>
                      <span className="font-bold text-brand-700">{formatCurrency(partsTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">ความเร่งด่วน</label>
                  <select className="input" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                    <option value="LOW">ต่ำ</option><option value="NORMAL">ปกติ</option>
                    <option value="HIGH">สูง</option><option value="URGENT">ด่วนมาก</option>
                  </select>
                </div>
                <div><label className="label">ราคาประเมิน (บาท)</label>
                  <input type="number" className="input" placeholder={partsTotal>0?String(partsTotal):"0"} value={form.estimatedCost} onChange={e=>setForm(f=>({...f,estimatedCost:e.target.value}))}/>
                  {partsTotal>0&&!form.estimatedCost&&<p className="text-xs text-stone-400 mt-1">จะใช้ {formatCurrency(partsTotal)} จากอะไหล่</p>}
                </div>
              </div>
              <div><label className="label">หมายเหตุช่าง</label><textarea className="input" rows={2} value={form.technicianNote} onChange={e=>setForm(f=>({...f,technicianNote:e.target.value}))}/></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{ setAddModal(false); setForm(EMPTY); setSelectedParts([]); }} className="btn-secondary flex-1">ยกเลิก</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving?"กำลังบันทึก...":"เปิดงานซ่อม"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Detail Modal ===== */}
      {detailJob && !editMode && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setDetailJob(null); }}>
          <div className="modal p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="font-mono text-xs text-stone-400">{detailJob.jobNumber}</span>
                <h2 className="text-2xl font-bold text-stone-800 mt-0.5">{detailJob.vehicleLabel}</h2>
                {detailJob.ownerName&&<p className="text-stone-500 text-sm mt-0.5">👤 {detailJob.ownerName}</p>}
                {detailJob.ownerPhone&&<p className="text-stone-400 text-sm flex items-center gap-1 mt-0.5"><Phone className="w-3.5 h-3.5"/>{detailJob.ownerPhone}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={()=>openEdit(detailJob)} className="btn-icon text-blue-500 hover:bg-blue-50"><Pencil className="w-4 h-4"/></button>
                <button onClick={()=>handleDelete(detailJob.id)} className="btn-icon text-red-400 hover:bg-red-50"><Trash2 className="w-4 h-4"/></button>
                <button onClick={()=>setDetailJob(null)} className="btn-icon"><XCircle className="w-5 h-5"/></button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <span className={cn("badge",JOB_STATUS_COLOR[detailJob.status])}>{JOB_STATUS_LABEL[detailJob.status]}</span>
                <span className={cn("badge",PRIORITY_COLOR[detailJob.priority])}>{PRIORITY_LABEL[detailJob.priority]}</span>
              </div>
              <div className="bg-surface-50 rounded-xl p-4">
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wide mb-1">รายการซ่อม</p>
                <p className="text-stone-800">{detailJob.description}</p>
              </div>
              {detailJob.usedParts && detailJob.usedParts.length>0 && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-xs text-purple-700 font-semibold uppercase tracking-wide mb-2">🔩 อะไหล่ที่ใช้</p>
                  <div className="space-y-1.5">
                    {detailJob.usedParts.map((up,i)=>(
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-stone-700">{up.part.name} × {up.quantity} {up.part.unit}</span>
                        <span className="font-semibold text-stone-800">{formatCurrency(up.unitPrice*up.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detailJob.technicianNote&&<div className="bg-amber-50 rounded-xl p-4"><p className="text-xs font-semibold text-amber-700 mb-1">หมายเหตุช่าง</p><p className="text-stone-700">{detailJob.technicianNote}</p></div>}
              {detailJob.estimatedCost>0&&<div className="bg-surface-50 rounded-xl p-3"><p className="text-xs text-stone-400">ราคาประเมิน</p><p className="font-bold text-xl text-brand-700">{formatCurrency(detailJob.estimatedCost)}</p></div>}
              <div>
                <p className="text-sm font-bold text-stone-600 mb-3">🔄 เปลี่ยนสถานะงาน</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map(s=>(
                    <button key={s.key} onClick={()=>updateStatus(detailJob.id,s.key)}
                      className={cn("py-3 px-3 rounded-xl border text-sm font-bold transition-all active:scale-95",
                        detailJob.status===s.key?cn(s.color,"ring-2 ring-offset-2 ring-current"):"bg-white border-surface-200 text-stone-600 hover:bg-surface-50")}>
                      {s.label}{detailJob.status===s.key&&" ✓"}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-stone-300 text-center">เปิดงานเมื่อ {formatDate(detailJob.createdAt)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== Edit Modal ===== */}
      {detailJob && editMode && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget){ setEditMode(false); setDetailJob(null); } }}>
          <div className="modal p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-stone-800">แก้ไขงานซ่อม</h2>
              <button onClick={()=>setEditMode(false)} className="btn-icon"><XCircle className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div><label className="label">รถ / ชื่องาน *</label><input className="input text-lg font-semibold" value={editForm.vehicleLabel} onChange={e=>setEditForm(f=>({...f,vehicleLabel:e.target.value}))} required autoFocus/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">ชื่อเจ้าของ</label><input className="input" value={editForm.ownerName} onChange={e=>setEditForm(f=>({...f,ownerName:e.target.value}))}/></div>
                <div><label className="label">เบอร์โทร</label><input className="input" value={editForm.ownerPhone} onChange={e=>setEditForm(f=>({...f,ownerPhone:e.target.value}))}/></div>
              </div>
              <div><label className="label">รายการซ่อม *</label><textarea className="input" rows={3} value={editForm.description} onChange={e=>setEditForm(f=>({...f,description:e.target.value}))} required/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">ความเร่งด่วน</label>
                  <select className="input" value={editForm.priority} onChange={e=>setEditForm(f=>({...f,priority:e.target.value}))}>
                    <option value="LOW">ต่ำ</option><option value="NORMAL">ปกติ</option>
                    <option value="HIGH">สูง</option><option value="URGENT">ด่วนมาก</option>
                  </select>
                </div>
                <div><label className="label">ราคาประเมิน (บาท)</label><input type="number" className="input" value={editForm.estimatedCost} onChange={e=>setEditForm(f=>({...f,estimatedCost:e.target.value}))}/></div>
              </div>
              <div><label className="label">หมายเหตุช่าง</label><textarea className="input" rows={2} value={editForm.technicianNote} onChange={e=>setEditForm(f=>({...f,technicianNote:e.target.value}))}/></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setEditMode(false)} className="btn-secondary flex-1">ยกเลิก</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving?"กำลังบันทึก...":"บันทึกการแก้ไข"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
