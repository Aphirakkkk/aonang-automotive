import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatCurrency(n: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(n);
}
export function formatDate(d: Date | string) { return format(new Date(d), "d MMM yyyy", { locale: th }); }
export function formatDateTime(d: Date | string) { return format(new Date(d), "d MMM yyyy HH:mm", { locale: th }); }

export const JOB_STATUS_LABEL: Record<string, string> = { PENDING:"รอดำเนินการ", IN_PROGRESS:"กำลังซ่อม", WAITING_PARTS:"รออะไหล่", COMPLETED:"เสร็จแล้ว", CANCELLED:"ยกเลิก" };
export const JOB_STATUS_COLOR: Record<string, string> = { PENDING:"bg-yellow-100 text-yellow-800 border-yellow-200", IN_PROGRESS:"bg-blue-100 text-blue-800 border-blue-200", WAITING_PARTS:"bg-purple-100 text-purple-800 border-purple-200", COMPLETED:"bg-green-100 text-green-800 border-green-200", CANCELLED:"bg-stone-100 text-stone-500 border-stone-200" };
export const PRIORITY_LABEL: Record<string, string> = { LOW:"ต่ำ", NORMAL:"ปกติ", HIGH:"สูง", URGENT:"ด่วนมาก" };
export const PRIORITY_COLOR: Record<string, string> = { LOW:"bg-stone-100 text-stone-500", NORMAL:"bg-blue-50 text-blue-700", HIGH:"bg-orange-100 text-orange-700", URGENT:"bg-red-100 text-red-700" };
export const INVOICE_STATUS_LABEL: Record<string, string> = { UNPAID:"ค้างชำระ", PAID:"ชำระแล้ว", CANCELLED:"ยกเลิก" };
export const INVOICE_STATUS_COLOR: Record<string, string> = { UNPAID:"bg-red-100 text-red-700 border-red-200", PAID:"bg-green-100 text-green-700 border-green-200", CANCELLED:"bg-stone-100 text-stone-500 border-stone-200" };
