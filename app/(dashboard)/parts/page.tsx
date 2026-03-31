"use client";
import { useEffect, useState, useRef } from "react";
import { Plus, Search, AlertTriangle, XCircle, Package, ImagePlus, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface Part { id:string; code:string; name:string; category:string; brand?:string; unit:string; costPrice:number; sellPrice:number; stock:number; minStock:number; imageUrl?:string; }

const EMPTY = { code:"", name:"", category:"", brand:"", unit:"ชิ้น", costPrice:"", sellPrice:"", stock:"", minStock:"5", imageUrl:"" };
const CATEGORIES = ["น้ำมัน","เครื่องยนต์","เบรก","ส่งกำลัง","ไฟฟ้า","ยาง","ตัวถัง","อื่นๆ"];

export default function PartsPage() {
  const [parts, setParts]         = useState<Part[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [cat, setCat]             = useState("ทั้งหมด");
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<Part|null>(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [restock, setRestock]     = useState<Part|null>(null);
  const [addQty, setAddQty]       = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState<string>("");
  const [viewImg, setViewImg]     = useState<Part|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() { const p = await fetch("/api/parts").then(r=>r.json()); setParts(p); setLoading(false); }
  useEffect(()=>{ load(); },[]);

  const cats     = ["ทั้งหมด", ...Array.from(new Set(parts.map(p=>p.category)))];
  const filtered = parts.filter(p =>
    (cat==="ทั้งหมด"||p.category===cat) &&
    (p.name.includes(search)||p.code.includes(search)||(p.brand??'').includes(search))
  );
  const lowStock = parts.filter(p=>p.stock<=p.minStock);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/upload", { method:"POST", body:fd });
      const data = await res.json();
      if (data.url) setForm(f=>({...f, imageUrl:data.url}));
      else alert("อัปโหลดรูปไม่สำเร็จ");
    } finally { setUploading(false); }
  }

  function openEdit(p: Part) {
    setEditing(p);
    setForm({ code:p.code, name:p.name, category:p.category, brand:p.brand??"", unit:p.unit, costPrice:String(p.costPrice), sellPrice:String(p.sellPrice), stock:String(p.stock), minStock:String(p.minStock), imageUrl:p.imageUrl??"" });
    setPreview(p.imageUrl??"");
    setModal(true);
  }
  function openAdd() { setEditing(null); setForm(EMPTY); setPreview(""); setModal(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const data = { ...form, costPrice:Number(form.costPrice), sellPrice:Number(form.sellPrice), stock:Number(form.stock), minStock:Number(form.minStock) };
    if (editing) await fetch(`/api/parts/${editing.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
    else await fetch("/api/parts", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
    await load(); setSaving(false); setModal(false);
  }

  async function handleRestock() {
    if (!restock||!addQty) return;
    await fetch(`/api/parts/${restock.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ stock:restock.stock+Number(addQty) }) });
    await load(); setRestock(null); setAddQty("");
  }

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-stone-800">คลังอะไหล่</h1><p className="text-sm text-stone-400">ทั้งหมด {parts.length} รายการ</p></div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4"/>เพิ่มอะไหล่</button>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0"/>
          <p className="text-sm text-red-700 font-medium">มี <strong>{lowStock.length} รายการ</strong> สต็อกใกล้หมด: {lowStock.map(p=>p.name).join(", ")}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"/>
          <input className="input pl-10" placeholder="ค้นหาชื่อ รหัส ยี่ห้อ..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={cn("px-3 py-2 rounded-xl text-sm font-medium border transition-all", cat===c?"bg-brand-600 text-white border-brand-600":"bg-white text-stone-600 border-surface-200 hover:bg-surface-50")}>{c}</button>
          ))}
        </div>
      </div>

      {/* Grid view with images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {loading ? Array(10).fill(0).map((_,i)=>(
          <div key={i} className="card p-0 overflow-hidden">
            <div className="h-36 bg-surface-200 animate-pulse"/>
            <div className="p-3 space-y-2"><div className="h-4 bg-surface-200 rounded animate-pulse"/><div className="h-3 w-20 bg-surface-100 rounded animate-pulse"/></div>
          </div>
        )) : filtered.map(part=>(
          <div key={part.id} className="card p-0 overflow-hidden hover:shadow-lift transition-all group">
            {/* Image */}
            <div
              className="relative h-36 bg-surface-100 flex items-center justify-center cursor-pointer overflow-hidden"
              onClick={()=>part.imageUrl&&setViewImg(part)}
            >
              {part.imageUrl ? (
                <img src={part.imageUrl} alt={part.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
              ) : (
                <div className="flex flex-col items-center gap-1 text-stone-300">
                  <Package className="w-10 h-10"/>
                  <span className="text-xs">ไม่มีรูป</span>
                </div>
              )}
              {part.stock <= part.minStock && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3"/>ใกล้หมด
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="font-bold text-stone-800 text-sm leading-tight line-clamp-2">{part.name}</p>
              <p className="text-[11px] text-stone-400 mt-0.5">{part.code} {part.brand && `· ${part.brand}`}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-brand-600 font-bold text-sm">{formatCurrency(part.sellPrice)}</span>
                <span className={cn("text-sm font-bold", part.stock<=part.minStock?"text-red-600":"text-green-700")}>
                  {part.stock} {part.unit}
                </span>
              </div>
              <div className="flex gap-1 mt-2">
                <button onClick={()=>setRestock(part)} className="flex-1 py-1 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">+สต็อก</button>
                <button onClick={()=>openEdit(part)} className="flex-1 py-1 text-xs font-semibold rounded-lg bg-surface-100 text-stone-600 hover:bg-surface-200 transition-colors">แก้ไข</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setModal(false); }}>
          <div className="modal p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-stone-800">{editing?"แก้ไขอะไหล่":"เพิ่มอะไหล่ใหม่"}</h2>
              <button onClick={()=>setModal(false)} className="btn-icon"><XCircle className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Image Upload */}
              <div>
                <label className="label">รูปภาพอะไหล่</label>
                <div className="flex items-center gap-3">
                  <div
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-surface-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-400 transition-colors bg-surface-50 shrink-0"
                    onClick={()=>fileRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-brand-500 animate-spin"/>
                    ) : preview ? (
                      <img src={preview} alt="preview" className="w-full h-full object-cover"/>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-stone-300">
                        <ImagePlus className="w-7 h-7"/>
                        <span className="text-[10px]">อัปโหลด</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-stone-400 space-y-1">
                    <p>คลิกที่กล่องเพื่อเลือกรูป</p>
                    <p className="text-xs">รองรับ JPG, PNG ขนาดไม่เกิน 10MB</p>
                    {form.imageUrl && <p className="text-xs text-green-600 font-medium">✓ อัปโหลดแล้ว</p>}
                  </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange}/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">รหัสอะไหล่ *</label><input className="input" placeholder="P001" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} required/></div>
                <div>
                  <label className="label">หมวดหมู่ *</label>
                  <select className="input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} required>
                    <option value="">-- เลือก --</option>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="label">ชื่ออะไหล่ *</label><input className="input" placeholder="น้ำมันเครื่อง 4T" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">ยี่ห้อ</label><input className="input" placeholder="Castrol" value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))}/></div>
                <div><label className="label">หน่วย</label><input className="input" placeholder="ชิ้น" value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">ราคาทุน (บาท)</label><input type="number" className="input" value={form.costPrice} onChange={e=>setForm(f=>({...f,costPrice:e.target.value}))}/></div>
                <div><label className="label">ราคาขาย (บาท)</label><input type="number" className="input" value={form.sellPrice} onChange={e=>setForm(f=>({...f,sellPrice:e.target.value}))}/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">จำนวนในสต็อก</label><input type="number" className="input" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/></div>
                <div><label className="label">สต็อกขั้นต่ำ</label><input type="number" className="input" value={form.minStock} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))}/></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setModal(false)} className="btn-secondary flex-1">ยกเลิก</button>
                <button type="submit" disabled={saving||uploading} className="btn-primary flex-1 justify-center">
                  {saving?"กำลังบันทึก...":uploading?"รอรูปอัปโหลด...":"บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restock && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setRestock(null); }}>
          <div className="modal p-6 max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-stone-800">เพิ่มสต็อก</h2>
              <button onClick={()=>setRestock(null)} className="btn-icon"><XCircle className="w-5 h-5"/></button>
            </div>
            {restock.imageUrl && <img src={restock.imageUrl} alt={restock.name} className="w-full h-32 object-cover rounded-2xl mb-4"/>}
            <p className="font-semibold text-stone-700 mb-1">{restock.name}</p>
            <p className="text-sm text-stone-400 mb-4">สต็อกปัจจุบัน: <strong className="text-stone-700">{restock.stock} {restock.unit}</strong></p>
            <label className="label">จำนวนที่ต้องการเพิ่ม</label>
            <input type="number" className="input mb-4" placeholder="0" value={addQty} onChange={e=>setAddQty(e.target.value)} autoFocus/>
            <div className="flex gap-3">
              <button onClick={()=>setRestock(null)} className="btn-secondary flex-1">ยกเลิก</button>
              <button onClick={handleRestock} className="btn-primary flex-1 justify-center">เพิ่มสต็อก</button>
            </div>
          </div>
        </div>
      )}

      {/* View Image Modal */}
      {viewImg && (
        <div className="modal-backdrop" onClick={()=>setViewImg(null)}>
          <div className="max-w-lg w-full" onClick={e=>e.stopPropagation()}>
            <img src={viewImg.imageUrl} alt={viewImg.name} className="w-full rounded-3xl shadow-modal"/>
            <div className="text-center mt-3">
              <p className="text-white font-bold">{viewImg.name}</p>
              <p className="text-white/60 text-sm">{viewImg.code}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
