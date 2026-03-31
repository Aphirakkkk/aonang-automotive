import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey    = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  const timestamp = Math.floor(Date.now() / 1000);
  const folder    = "aonang-parts";

  // Sign
  const str = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgBuffer);
  const signature  = Array.from(new Uint8Array(hashBuffer)).map(b=>b.toString(16).padStart(2,"0")).join("");

  const upload = new FormData();
  upload.append("file", file);
  upload.append("api_key", apiKey);
  upload.append("timestamp", String(timestamp));
  upload.append("signature", signature);
  upload.append("folder", folder);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method:"POST", body:upload });
  const data = await res.json();

  if (!res.ok) return NextResponse.json({ error: data.error?.message ?? "Upload failed" }, { status: 500 });
  return NextResponse.json({ url: data.secure_url });
}
