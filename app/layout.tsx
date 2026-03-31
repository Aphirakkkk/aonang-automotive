import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "อ่าวนางยานยนต์", description: "ระบบจัดการร้านซ่อมรถมอเตอร์ไซค์" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="th"><body>{children}</body></html>;
}
