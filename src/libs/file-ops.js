// import { s3Client } from '@/utils/s3';
// import { PutObjectCommand } from '@aws-sdk/client-s3';

// export async function uploadFile({ key, folder, body }) {
//   const buffer = Buffer.from(await body.arrayBuffer());

//   try {
//     const command = new PutObjectCommand({
//       Bucket: 'devscale-batch8',
//       Key: `${folder}/${key}`,
//       Body: buffer,
//       ContentType: body.type,
//     });

//     const fileUpload = await s3Client.send(command);
//     console.log(fileUpload);
//   } catch (error) {
//     console.error(error);
//   }
// }

// /src/libs/file-ops.js
// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { s3Client } from '@/utils/s3';

// export async function uploadFile({ key, folder, body }) {
//   try {
//     // Convert File/Blob to ArrayBuffer
//     let buffer;
//     let contentType;
    
//     if (body instanceof Blob || body instanceof File) {
//       buffer = await body.arrayBuffer();
//       contentType = body.type;
//     } else {
//       buffer = body;
//     }

//     // Prepare the full path including folder
//     const fullPath = folder ? `${folder}/${key}` : key;
    
//     // Upload to Cloudflare R2
//     const command = new PutObjectCommand({
//       Bucket: process.env.R2_BUCKET_NAME,
//       Key: fullPath,
//       Body: buffer,
//       ContentType: contentType,
//       // Set public read permissions
//       ACL: "public-read",
//     });

//     const response = await s3Client.send(command);
//     console.log("File uploaded successfully:", fullPath);
    
//     // Construct the public URL
//     const publicUrl = `${process.env.R2_DEV_URL}/${fullPath}`;
    
//     return {
//       success: true,
//       key: fullPath,
//       url: publicUrl,
//     };
//   } catch (error) {
//     console.error("Error uploading file to R2:", error);
//     throw new Error(`Failed to upload file: ${error.message}`);
//   }
// }

// export function getPublicUrl(key, folder) {
//   const fullPath = folder ? `${folder}/${key}` : key;
//   return `${process.env.R2_DEV_URL}/${fullPath}`;
// }


// /src/libs/file-ops.js
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from '@/utils/s3';

export async function uploadFile({ key, folder, body }) {
  // 1. Verify environment variables
  if (!process.env.R2_BUCKET_NAME) {
    console.warn("R2_BUCKET_NAME is not set in environment variables!");
  }
  if (!process.env.R2_DEV_URL) {
    console.warn("R2_DEV_URL is not set in environment variables!");
  }

  try {
    // 2. Convert File/Blob to ArrayBuffer
    let buffer;
    let contentType;
    if (body instanceof Blob || body instanceof File) {
      buffer = await body.arrayBuffer();
      contentType = body.type;
    } else {
      buffer = body; // raw data or something else
    }

    // 3. Ensure folder isn’t undefined
    const safeFolder = folder || ""; // fallback to empty string
    const fullPath = safeFolder ? `${safeFolder}/${key}` : key;

    // 4. Upload to Cloudflare R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fullPath,
      Body: buffer,
      ContentType: contentType,
      ACL: "public-read",
    });

    await s3Client.send(command);
    console.log("File uploaded successfully:", fullPath);

    // 5. Construct the public URL
    //    Make sure R2_DEV_URL is a valid base URL in your .env or .env.local
    const publicUrl = `${process.env.R2_DEV_URL}/${fullPath}`;
    console.log("Constructed public URL:", publicUrl);

    return {
      success: true,
      key: fullPath,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Error uploading file to R2:", error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

export function getPublicUrl(key, folder) {
  const safeFolder = folder || "";
  const fullPath = safeFolder ? `${safeFolder}/${key}` : key;
  return `${process.env.R2_DEV_URL}/${fullPath}`;
}
