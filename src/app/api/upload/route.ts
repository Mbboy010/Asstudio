import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const isPaid = formData.get("isPaid") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

    // Always use the public bucket for all files
    const targetBucket = process.env.NEXT_PUBLIC_RUMPTY_PUBLIC_BUCKET;

    const command = new PutObjectCommand({
      Bucket: targetBucket,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Generate the public direct URL for the file
    const fileUrl = `${process.env.RUMPTY_S3_ENDPOINT}/${targetBucket}/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      isPaid, 
      fileUrl,
      fileKey: fileName // Keep fileKey just in case, but fileUrl will directly point to it
    });

  } catch (error) {
    console.error("S3 Upload Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}