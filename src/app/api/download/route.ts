import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/s3";

export async function POST(request: Request) {
  try {
    const { fileKey } = await request.json();

    if (!fileKey) {
      return NextResponse.json({ error: "No file key provided" }, { status: 400 });
    }

    // Generate a secure temporary download link valid for 15 minutes
    const command = new GetObjectCommand({
      Bucket: process.env.RUMPTY_PRIVATE_BUCKET,
      Key: fileKey,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    return NextResponse.json({ success: true, downloadUrl });
  } catch (error) {
    console.error("Download Link Error:", error);
    return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
  }
}