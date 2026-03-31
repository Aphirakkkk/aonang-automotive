"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Wrench, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("aphiraksainui@gmail.com");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) { setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง"); setLoading(false); }
    else { router.push("/dashboard"); router.refresh(); }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#ea580c 0%,#c2410c 60%,#9a3412 100%)" }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">อ่าวนางยานยนต์</p>
            <p className="text-orange-200 text-xs">Ao Nang Automotive</p>
          </div>
        </div>
        <div className="relative z-10">
          <h2 className="text-white text-4xl font-bold leading-snug mb-3">ระบบจัดการ<br/>ร้านซ่อมรถ<br/>ครบวงจร</h2>
          <p className="text-orange-100 text-lg">จัดการงานซ่อม อะไหล่ ลูกค้า<br/>และบัญชีรายวัน ง่ายๆ ในที่เดียว</p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-3">
          {[["🔧","งานซ่อม","ครบวงจร"],["👥","ลูกค้า","ประจำ"],["📦","อะไหล่","ครบสต็อก"],["📒","บัญชี","รายวัน"]].map(([icon,t,s])=>(
            <div key={t} className="bg-white/10 rounded-2xl p-4">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-white font-bold">{t}</div>
              <div className="text-orange-200 text-xs">{s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-stone-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-stone-800">อ่าวนางยานยนต์</p>
              <p className="text-xs text-stone-400">Ao Nang Automotive</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-stone-800 mb-1">เข้าสู่ระบบ</h2>
          <p className="text-stone-400 text-sm mb-8">ยินดีต้อนรับ กรุณากรอกข้อมูลเพื่อเข้าใช้งาน</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">อีเมล</label>
              <input type="email" className="input" placeholder="กรอกอีเมล" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label">รหัสผ่าน</label>
              <div className="relative">
                <input type={showPass?"text":"password"} className="input pr-11" placeholder="กรอกรหัสผ่าน" value={password} onChange={e=>setPassword(e.target.value)} required />
                <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                  {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0"/> {error}
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>กำลังเข้าสู่ระบบ...</> : "เข้าสู่ระบบ"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-surface-100 rounded-2xl text-xs text-stone-500 space-y-1">
            <p className="font-semibold text-stone-600">ข้อมูลทดสอบ</p>
            <p>📧 aphiraksainui@gmail.com</p>
            <p>🔑 123456</p>
          </div>
          <p className="text-center text-xs text-stone-300 mt-4">188 ม.2 ต.อ่าวนาง อ.เมือง จ.กระบี่ · 081-0827810</p>
        </div>
      </div>
    </div>
  );
}
