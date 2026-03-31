import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { subDays, addDays } from "date-fns";

const prisma = new PrismaClient();

const VEHICLES = [
  "เวฟ 125 ดำ","เวฟ 125 แดง","เวฟ 110 ขาว","เวฟ 100S น้ำเงิน",
  "ฟีโน่ ขาว","ฟีโน่ ชมพู","ฟีโน่ ดำ",
  "PCX ขาว","PCX ดำ","PCX แดง",
  "Click 125 ขาว","Click 125 น้ำเงิน",
  "NMAX เทา","NMAX ขาว",
  "Aerox ดำ","Aerox แดง",
  "Dream ดำ","Dream แดง",
  "Fino ฟ้า","Fino ชมพู",
  "Mio เขียว","Mio ขาว",
  "CBR 150 แดง","Sonic ดำ",
];
const OWNERS = ["สมชาย","มาลี","วิชัย","สุดา","ประทีป","นภา","กิตติ","อรุณ","พิมพ์ใจ","ธนา","รัตนา","บุญมา","ศรีวรรณ","ประเสริฐ","จุฬา","วันดี","ทองคำ","สุรชัย","นันทา","เพ็ญศรี"];
const PHONES = ["081","082","083","084","085","086","087","088","089","090","091","092","093","094","095"];
const REPAIRS = [
  "เปลี่ยนน้ำมันเครื่อง + ตรวจเช็คทั่วไป",
  "เปลี่ยนผ้าเบรกหน้า-หลัง",
  "เปลี่ยนสายพาน CVT",
  "เปลี่ยนหัวเทียน + ไส้กรองอากาศ",
  "เปลี่ยนแบตเตอรี่",
  "ซ่อมระบบไฟ เปลี่ยนหลอดไฟหน้า",
  "เปลี่ยนยางหน้า-หลัง",
  "เปลี่ยนโซ่ + สเตอร์",
  "ล้างคาร์บูเรเตอร์",
  "เปลี่ยนน้ำมันเครื่อง",
  "ตรวจเช็ค 6 เดือน",
  "เปลี่ยนยางใน",
  "ซ่อมระบบเบรก",
  "เปลี่ยนกระจกมองหลัง",
  "ซ่อมสตาร์ทไฟฟ้า",
];

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rndNum(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndPhone() { return `${rnd(PHONES)}-${rndNum(1000,9999)}-${rndNum(1000,9999)}`; }

async function main() {
  console.log("🌱 กำลัง seed ข้อมูล 3 เดือน...");

  // ลบข้อมูลเก่า
  await prisma.ledgerEntry.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.jobPart.deleteMany();
  await prisma.job.deleteMany();
  await prisma.part.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const pw = await bcrypt.hash("123456", 10);
  await prisma.user.createMany({
    data: [
      { email:"aphiraksainui@gmail.com", password:pw, name:"เจ้าของร้าน", role:"OWNER" },
      { email:"staff@aonang.com",        password:pw, name:"ช่างซ่อม",    role:"STAFF" },
    ],
  });

  // Parts
  const parts = await prisma.part.createManyAndReturn({
    data: [
      { code:"P001", name:"น้ำมันเครื่อง 4T",    category:"น้ำมัน",     brand:"Castrol", unit:"ลิตร",  costPrice:85,  sellPrice:120, stock:48, minStock:10 },
      { code:"P002", name:"สายพาน CVT",           category:"เครื่องยนต์", brand:"Yamaha",  unit:"เส้น",  costPrice:320, sellPrice:480, stock:15, minStock:5  },
      { code:"P003", name:"หัวเทียน NGK",          category:"ไฟฟ้า",      brand:"NGK",     unit:"หัว",   costPrice:55,  sellPrice:90,  stock:30, minStock:10 },
      { code:"P004", name:"ผ้าเบรกหน้า",           category:"เบรก",       brand:"EBC",     unit:"ชุด",   costPrice:180, sellPrice:280, stock:18, minStock:5  },
      { code:"P005", name:"ผ้าเบรกหลัง",           category:"เบรก",       brand:"EBC",     unit:"ชุด",   costPrice:150, sellPrice:240, stock:3,  minStock:5  },
      { code:"P006", name:"แบตเตอรี่ 5Ah",        category:"ไฟฟ้า",      brand:"Yuasa",   unit:"ลูก",   costPrice:450, sellPrice:650, stock:10, minStock:3  },
      { code:"P007", name:"ยางนอกหน้า 80/90-14",  category:"ยาง",        brand:"IRC",     unit:"เส้น",  costPrice:380, sellPrice:550, stock:6,  minStock:2  },
      { code:"P008", name:"ยางนอกหลัง 90/90-14", category:"ยาง",        brand:"IRC",     unit:"เส้น",  costPrice:420, sellPrice:600, stock:2,  minStock:2  },
      { code:"P009", name:"หลอดไฟหน้า LED",       category:"ไฟฟ้า",      brand:"Philips", unit:"หลอด",  costPrice:120, sellPrice:200, stock:20, minStock:5  },
      { code:"P010", name:"โซ่ 420",               category:"ส่งกำลัง",   brand:"DID",     unit:"เส้น",  costPrice:220, sellPrice:350, stock:12, minStock:3  },
      { code:"P011", name:"ไส้กรองอากาศ",          category:"เครื่องยนต์", brand:"Honda",   unit:"ชิ้น",  costPrice:65,  sellPrice:110, stock:20, minStock:5  },
      { code:"P012", name:"น้ำมันเกียร์",          category:"น้ำมัน",     brand:"Shell",   unit:"ลิตร",  costPrice:90,  sellPrice:140, stock:15, minStock:5  },
    ],
  });

  // Jobs - 3 months
  const now = new Date();
  const jobsData = [];
  let jobCount = 1;

  for (let d = 90; d >= 0; d--) {
    const date = subDays(now, d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue;
    const jobsToday = dayOfWeek === 6 ? rndNum(2,4) : rndNum(3,7);

    for (let j = 0; j < jobsToday; j++) {
      const isRecent = d < 3;
      const status   = isRecent ? rnd(["PENDING","IN_PROGRESS","WAITING_PARTS"]) : "COMPLETED";
      const vehicle  = rnd(VEHICLES);
      const owner    = Math.random() > 0.3 ? rnd(OWNERS) : undefined;
      const phone    = owner && Math.random() > 0.4 ? rndPhone() : undefined;
      const cost     = rndNum(3,25) * 50;
      const createdAt = new Date(date);
      createdAt.setHours(rndNum(8,17), rndNum(0,59), 0, 0);

      jobsData.push({
        jobNumber:     `JOB-${String(jobCount++).padStart(3,"0")}`,
        vehicleLabel:  vehicle,
        ownerName:     owner,
        ownerPhone:    phone,
        description:   rnd(REPAIRS),
        status,
        priority:      rnd(["NORMAL","NORMAL","NORMAL","HIGH","LOW"]),
        estimatedCost: cost,
        actualCost:    status==="COMPLETED" ? cost + rndNum(-50,100) : 0,
        startDate:     status!=="PENDING" ? createdAt : undefined,
        completedAt:   status==="COMPLETED" ? addDays(createdAt, rndNum(0,1)) : undefined,
        createdAt,
        updatedAt:     createdAt,
      });
    }
  }

  await prisma.job.createMany({ data: jobsData });
  console.log(`   🛠  Jobs: ${jobsData.length}`);

  // Invoices - สำหรับงานที่เสร็จแล้ว 30 งานแรก
  const completedJobs = jobsData.filter(j=>j.status==="COMPLETED").slice(0,30);
  for (let i=0; i<completedJobs.length; i++) {
    const job = completedJobs[i];
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${String(i+1).padStart(3,"0")}`,
        customerName:  job.ownerName ?? job.vehicleLabel,
        customerPhone: job.ownerPhone,
        jobId:         undefined,
        subtotal:      job.actualCost,
        total:         job.actualCost,
        status:        "PAID",
        paidAt:        job.completedAt,
        createdAt:     job.completedAt ?? job.createdAt,
        updatedAt:     job.completedAt ?? job.createdAt,
        items: {
          create: [
            { description:`ค่าซ่อม: ${job.description}`, quantity:1, unitPrice:job.actualCost*0.6, total:job.actualCost*0.6 },
            { description:"ค่าอะไหล่", quantity:1, unitPrice:job.actualCost*0.4, total:job.actualCost*0.4 },
          ],
        },
      },
    });
  }
  console.log(`   🧾 Invoices: ${completedJobs.length}`);

  // Ledger - 3 months
  const ledger = [];
  for (let d=90; d>=0; d--) {
    const date = subDays(now, d);
    if (date.getDay()===0) continue;
    date.setHours(8,0,0,0);
    const isWeekend = date.getDay()===6;
    const income = isWeekend ? rndNum(1200,2500) : rndNum(1800,4500);
    ledger.push({ date, type:"INCOME" as const, category:"ค่าซ่อม", description:"รายได้ค่าซ่อมประจำวัน", amount:income });
    ledger.push({ date:new Date(date.getTime()+60000), type:"EXPENSE" as const, category:"ค่าใช้จ่ายประจำวัน", description:"หักถอนค่าใช้จ่ายประจำวัน", amount:1500 });
    if (Math.random()>0.65) {
      ledger.push({ date:new Date(date.getTime()+120000), type:"EXPENSE" as const, category:"ซื้ออะไหล่", description:"ซื้ออะไหล่เข้าร้าน", amount:rndNum(500,3000) });
    }
  }
  await prisma.ledgerEntry.createMany({ data: ledger });

  console.log(`   📒 Ledger: ${ledger.length} รายการ`);
  console.log(`   👤 Users: 2 | 🔧 Parts: ${parts.length}`);
  console.log("✅ Seed เสร็จแล้ว!");
}

main().catch(console.error).finally(()=>prisma.$disconnect());
