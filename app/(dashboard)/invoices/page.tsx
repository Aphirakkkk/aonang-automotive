"use client";
import { useEffect, useState } from "react";
import { Plus, Search, XCircle, CheckCircle, ChevronDown } from "lucide-react";
import { cn, formatCurrency, formatDate, INVOICE_STATUS_LABEL, INVOICE_STATUS_COLOR } from "@/lib/utils";

interface Job { id:string; jobNumber:string; vehicleLabel:string; ownerName?:string; ownerPhone?:string; description:string; estimatedCost:number; }
interface InvoiceItem { description:string; quantity:number; unitPrice:number; total:number; }
interface Invoice {
  id:string; invoiceNumber:string; status:string; subtotal:number; discount:number; total:number;
  note?:string; paidAt?:string; createdAt:string; items:InvoiceItem[];
  customerName:string; customerPhone?:string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [jobs, setJobs]         = useState<Job[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("ALL");
  const [modal, setModal]       = useState(false);
  const [detail, setDetail]     = useState<Invoice|null>(null);
  const [saving, setSaving]     = useState(false);

  // form state
  const [selectedJob, setSelectedJob] = useState<Job|null>(null);
  const [jobSearch, setJobSearch]     = useState("");
  const [showJobList, setShowJobList] = useState(false);
  const [customerName, setCustomerName]   = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote]       = useState("");
  const [discount, setDiscount] = useState("0");
  const [items, setItems]     = useState<InvoiceItem[]>([{ description:"", quantity:1, unitPrice:0, total:0 }]);

  async function load() {
    try {
      const [inv, j] = await Promise.all([
        fetch("/api/invoices").then(r=>r.json()),
        fetch("/api/jobs").then(r=>r.json()),
      ]);
      setInvoices(Array.isArray(inv) ? inv : []);
      setJobs(Array.isArray(j) ? j : []);
    } catch { setInvoices([]); setJobs([]); }
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  // เมื่อเลือกงานซ่อม → ดึงข้อมูลมาใส่อัตโนมัติ
  function selectJob(job: Job) {
    setSelectedJob(job);
    setCustomerName(job.ownerName ?? job.vehicleLabel);
    setCustomerPhone(job.ownerPhone ?? "");
    setJobSearch(`${job.jobNumber} - ${job.vehicleLabel}`);
    setShowJobList(false);
    // สร้าง item อัตโนมัติจากงานซ่อม
    setItems([
      { description:`ค่าซ่อม: ${job.description}`, quantity:1, unitPrice:job.estimatedCost*0.7, total:job.estimatedCost*0.7 },
      { description:"ค่าอะไหล่", quantity:1, unitPrice:job.estimatedCost*0.3, total:job.estimatedCost*0.3 },
    ]);
  }

  function clearJob() {
    setSelectedJob(null);
    setJobSearch("");
    setCustomerName("");
    setCustomerPhone("");
    setItems([{ description:"", quantity:1, unitPrice:0, total:0 }]);
  }

  function updateItem(i: number, field: keyof InvoiceItem, val: string|number) {
    setItems(prev=>{
      const next = [...prev];
      (next[i] as Record<string,unknown>)[field] = val;
      if (field==="quantity"||field==="unitPrice") {
        next[i].total = Number(next[i].quantity)*Number(next[i].unitPrice);
      }
      return next;
    });
  }

  const subtotal = items.reduce((s,it)=>s+it.total,0);
  const discountNum = Number(discount)||0;
  const total = subtotal - discountNum;

  function resetForm() {
    setSelectedJob(null); setJobSearch(""); setCustomerName(""); setCustomerPhone("");
    setNote(""); setDiscount("0");
    setItems([{ description:"", quantity:1, unitPrice:0, total:0 }]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch("/api/invoices", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        customerName, customerPhone, note,
        jobId: selectedJob?.id ?? null,
        subtotal, discount:discountNum, total,
        items: items.map(it=>({...it, quantity:Number(it.quantity), unitPrice:Number(it.unitPrice), total:Number(it.total)})),
      }),
    });
    await load(); setSaving(false); setModal(false); resetForm();
  }

  async function markPaid(id: string) {
    await fetch(`/api/invoices/${id}`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ status:"PAID", paidAt:new Date().toISOString() }),
    });
    await load(); setDetail(null);
  }

  const filtered = invoices.filter(inv=>
    (filter==="ALL"||inv.status===filter) &&
    (inv.customerName?.includes(search)||inv.invoiceNumber?.includes(search))
  );

  // กรองงานซ่อมสำหรับ search
  const filteredJobs = jobs.filter(j=>
    j.vehicleLabel.includes(jobSearch) ||
    j.jobNumber.includes(jobSearch) ||
    (j.ownerName??'').includes(jobSearch)
  ).slice(0,10);

  return (
    <div className="space-y-4 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-stone-800">ใบแจ้งหนี้</h1><p className="text-sm text-stone-400">ทั้งหมด {invoices.length} รายการ</p></div>
        <button onClick={()=>setModal(true)} className="btn-primary"><Plus className="w-4 h-4"/>สร้างใบแจ้งหนี้</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400"/>
          <input className="input pl-10" placeholder="ค้นหาชื่อ เลขที่ใบแจ้งหนี้..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-2">
          {[["ALL","ทั้งหมด"],["UNPAID","ค้างชำระ"],["PAID","ชำระแล้ว"]].map(([k,l])=>(
            <button key={k} onClick={()=>setFilter(k)}
              className={cn("px-3 py-2 rounded-xl text-sm font-medium border transition-all",
                filter===k?"bg-brand-600 text-white border-brand-600":"bg-white text-stone-600 border-surface-200 hover:bg-surface-50")}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>เลขที่</th><th>ชื่อ / รถ</th><th>รายการ</th><th>ส่วนลด</th><th>ยอดรวม</th><th>สถานะ</th><th>วันที่</th><th></th></tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} className="text-center py-8 text-stone-400">กำลังโหลด...</td></tr>
              : filtered.length===0
              ? <tr><td colSpan={8} className="text-center py-10 text-stone-300"><p className="text-3xl mb-2">🧾</p><p>ไม่มีใบแจ้งหนี้</p></td></tr>
              : filtered.map(inv=>(
                <tr key={inv.id} onClick={()=>setDetail(inv)} className="cursor-pointer">
                  <td><span className="font-mono text-xs text-stone-500">{inv.invoiceNumber}</span></td>
                  <td><p className="font-semibold text-stone-800">{inv.customerName}</p>{inv.customerPhone&&<p className="text-xs text-stone-400">{inv.customerPhone}</p>}</td>
                  <td><p className="text-sm text-stone-600">{inv.items?.length ?? 0} รายการ</p></td>
                  <td>{inv.discount>0?<span className="text-red-600 text-sm">-{formatCurrency(inv.discount)}</span>:"-"}</td>
                  <td><span className="font-bold text-stone-800">{formatCurrency(inv.total)}</span></td>
                  <td><span className={cn("badge",INVOICE_STATUS_COLOR[inv.status])}>{INVOICE_STATUS_LABEL[inv.status]}</span></td>
                  <td className="text-xs text-stone-400">{formatDate(inv.createdAt)}</td>
                  <td onClick={e=>e.stopPropagation()}>
                    {inv.status==="UNPAID"&&(
                      <button onClick={()=>markPaid(inv.id)} className="btn-ghost text-xs py-1 px-2 text-green-700 hover:bg-green-50">รับเงิน</button>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

      {/* ===== Create Modal ===== */}
      {modal && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget){ setModal(false); resetForm(); } }}>
          <div className="modal p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-stone-800">สร้างใบแจ้งหนี้</h2>
              <button onClick={()=>{ setModal(false); resetForm(); }} className="btn-icon"><XCircle className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* เลือกจากงานซ่อม */}
              <div>
                <label className="label">เลือกจากงานซ่อม <span className="text-stone-400 font-normal">(ไม่บังคับ)</span></label>
                <div className="relative">
                  <input
                    className="input pr-8"
                    placeholder="พิมพ์ค้นหา เช่น เวฟ ดำ, JOB-001..."
                    value={jobSearch}
                    onChange={e=>{ setJobSearch(e.target.value); setShowJobList(true); if(!e.target.value) clearJob(); }}
                    onFocus={()=>setShowJobList(true)}
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none"/>
                  {showJobList && jobSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-surface-200 rounded-2xl shadow-lift overflow-hidden">
                      {filteredJobs.length===0
                        ? <p className="text-center text-stone-400 text-sm py-3">ไม่พบงานซ่อม</p>
                        : filteredJobs.map(job=>(
                          <button key={job.id} type="button"
                            onClick={()=>selectJob(job)}
                            className="w-full text-left px-4 py-3 hover:bg-surface-50 border-b border-surface-100 last:border-0 transition-colors">
                            <p className="font-semibold text-stone-800 text-sm">{job.vehicleLabel}</p>
                            <p className="text-xs text-stone-400">{job.jobNumber} {job.ownerName&&`· ${job.ownerName}`} · {formatCurrency(job.estimatedCost)}</p>
                          </button>
                        ))
                      }
                    </div>
                  )}
                </div>
                {selectedJob && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-brand-50 border border-brand-200 rounded-xl">
                    <span className="text-sm text-brand-700 font-medium flex-1">✓ เลือก: {selectedJob.vehicleLabel} ({selectedJob.jobNumber})</span>
                    <button type="button" onClick={clearJob} className="text-stone-400 hover:text-stone-600"><XCircle className="w-4 h-4"/></button>
                  </div>
                )}
              </div>

              {/* ชื่อ + เบอร์ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">ชื่อลูกค้า / รถ *</label>
                  <input className="input" placeholder="เช่น เวฟ ดำ สมชาย"
                    value={customerName} onChange={e=>setCustomerName(e.target.value)} required/>
                </div>
                <div>
                  <label className="label">เบอร์โทร</label>
                  <input className="input" placeholder="081-xxx-xxxx"
                    value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)}/>
                </div>
              </div>

              {/* รายการ */}
              <div>
                <label className="label">รายการ</label>
                <div className="space-y-2">
                  {items.map((it,i)=>(
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input className="input col-span-5" placeholder="รายการ" value={it.description}
                        onChange={e=>updateItem(i,"description",e.target.value)}/>
                      <input type="number" className="input col-span-2" placeholder="จำนวน" value={it.quantity}
                        onChange={e=>updateItem(i,"quantity",Number(e.target.value))}/>
                      <input type="number" className="input col-span-3" placeholder="ราคา/หน่วย" value={it.unitPrice}
                        onChange={e=>updateItem(i,"unitPrice",Number(e.target.value))}/>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-sm font-semibold text-stone-700">{formatCurrency(it.total)}</span>
                        {items.length>1&&(
                          <button type="button" onClick={()=>setItems(p=>p.filter((_,idx)=>idx!==i))}
                            className="text-stone-300 hover:text-red-400 ml-1"><XCircle className="w-4 h-4"/></button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button"
                    onClick={()=>setItems(p=>[...p,{description:"",quantity:1,unitPrice:0,total:0}])}
                    className="btn-ghost text-sm py-1.5 w-full justify-center border border-dashed border-surface-300">
                    + เพิ่มรายการ
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">ส่วนลด (บาท)</label>
                  <input type="number" className="input" value={discount} onChange={e=>setDiscount(e.target.value)}/>
                </div>
                <div className="bg-brand-50 rounded-xl p-3 flex flex-col justify-center">
                  <p className="text-xs text-brand-600 font-semibold">ยอดรวมสุทธิ</p>
                  <p className="text-2xl font-bold text-brand-700">{formatCurrency(total)}</p>
                </div>
              </div>

              <div>
                <label className="label">หมายเหตุ</label>
                <textarea className="input" rows={2} value={note} onChange={e=>setNote(e.target.value)}/>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>{ setModal(false); resetForm(); }} className="btn-secondary flex-1">ยกเลิก</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving?"กำลังบันทึก...":"สร้างใบแจ้งหนี้"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Detail Modal ===== */}
      {detail && (
        <div className="modal-backdrop" onClick={e=>{ if(e.target===e.currentTarget) setDetail(null); }}>
          <div className="modal p-6" onClick={e=>e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="font-mono text-xs text-stone-400">{detail.invoiceNumber}</span>
                <h2 className="text-xl font-bold text-stone-800 mt-0.5">{detail.customerName}</h2>
                {detail.customerPhone&&<p className="text-stone-400 text-sm">{detail.customerPhone}</p>}
              </div>
              <button onClick={()=>setDetail(null)} className="btn-icon"><XCircle className="w-5 h-5"/></button>
            </div>
            <span className={cn("badge mb-4",INVOICE_STATUS_COLOR[detail.status])}>{INVOICE_STATUS_LABEL[detail.status]}</span>
            <div className="mt-3 space-y-1">
              {detail.items?.map((it,i)=>(
                <div key={i} className="flex justify-between text-sm py-2 border-b border-surface-100">
                  <span className="text-stone-700">{it.description} x{it.quantity}</span>
                  <span className="font-semibold">{formatCurrency(it.total)}</span>
                </div>
              ))}
              {detail.discount>0&&<div className="flex justify-between text-sm py-2 text-red-600"><span>ส่วนลด</span><span>-{formatCurrency(detail.discount)}</span></div>}
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>รวมสุทธิ</span>
                <span className="text-brand-700">{formatCurrency(detail.total)}</span>
              </div>
            </div>
            {detail.note&&<p className="text-sm text-stone-500 mt-3 bg-surface-50 rounded-xl px-3 py-2">{detail.note}</p>}
            {detail.status==="UNPAID"&&(
              <button onClick={()=>markPaid(detail.id)} className="btn-primary w-full justify-center mt-4">
                <CheckCircle className="w-4 h-4"/> รับเงินแล้ว
              </button>
            )}
            {detail.paidAt&&<p className="text-xs text-stone-400 text-center mt-2">ชำระเมื่อ {formatDate(detail.paidAt)}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
