// /app/(app)/upload/actions.js
"use server";

import { uploadFile } from "@/libs/file-ops";
import { parseReceipt } from "@/libs/llamaparse";
import { prisma } from "@/utils/prisma";
import { auth } from "@/libs/auth";
import { revalidatePath } from "next/cache";

export async function uploadReceiptAction(formData) {
  try {
    // Check user authentication
    const session = await auth();
    if (!session?.user) {
      return { error: "You must be logged in to upload receipts" };
    }

    // Get file from form data
    const file = formData.get("file");
    if (!file) {
      return { error: "No file provided" };
    }

    // Generate a unique filename
    const timestamp = new Date().getTime();
    const fileExt = file.type.split('/')[1] || 'jpg';
    const fileName = `receipt-${timestamp}.${fileExt}`;

    // Upload file to R2
    await uploadFile({
      key: fileName,
      folder: session.user.id,
      body: file,
    });

    // Get the public URL of the uploaded file
    const publicUrl = `${process.env.R2_DEV_URL}/${session.user.id}/${fileName}`;

    // Process the receipt with LlamaParse (using LVM and Gemini model)
    const receiptData = await parseReceipt(publicUrl);

    // Validate the parsed data
    if (!receiptData || typeof receiptData !== 'object') {
      return { 
        error: "Invalid data returned from receipt parsing service",
        debug: { receiptData }
      };
    }

    // Ensure items array is properly formatted
    const formattedData = {
      ...receiptData,
      items: Array.isArray(receiptData.items) 
        ? receiptData.items.map(item => ({
            name: item.name || "Unknown Item",
            price: typeof item.price === 'number' ? item.price : parseFloat(item.price || 0) || 0,
            quantity: typeof item.quantity === 'number' ? item.quantity : parseInt(item.quantity || 1) || 1
          }))
        : [],
      // Format date if it's a Date object
      date: receiptData.date instanceof Date 
        ? receiptData.date.toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      // Ensure numeric values
      totalAmount: typeof receiptData.totalAmount === 'number' 
        ? receiptData.totalAmount 
        : parseFloat(receiptData.totalAmount || 0) || 0,
      tax: typeof receiptData.tax === 'number' 
        ? receiptData.tax 
        : parseFloat(receiptData.tax || 0) || 0,
      subtotal: typeof receiptData.subtotal === 'number' 
        ? receiptData.subtotal 
        : parseFloat(receiptData.subtotal || 0) || 0,
    };

    // Return the parsed data for editing in the form before saving to database
    return { 
      success: true, 
      parsedData: formattedData, 
      imageUrl: publicUrl 
    };
  } catch (error) {
    console.error("Receipt upload error:", error);
    return { 
      error: error.message || "Failed to upload and process receipt",
      stack: error.stack 
    };
  }
}

// Action to handle submit
export async function saveManualReceiptAction(data) {
  try {
    // Check user authentication
    const session = await auth();
    if (!session?.user) {
      return { error: "You must be logged in to create receipts" };
    }

    // Validate the input data
    if (!data.restaurant || !data.date) {
      return { error: "Missing required fields: restaurant name and date are required" };
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return { error: "At least one item is required" };
    }

    // Create receipt and items in the database
    const receipt = await prisma.receipt.create({
      data: {
        userId: session.user.id,
        image: data.imageUrl || null, 
        totalAmount: parseFloat(data.totalAmount) || 0,
        date: new Date(data.date) || new Date(),
        restaurant: data.restaurant || "Unknown Restaurant",
        tax: parseFloat(data.tax) || 0,
        subtotal: parseFloat(data.subtotal) || 0,
        items: {
          create: (data.items || []).map(item => ({
            name: item.name || "Unknown Item",
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
            assignedTo: data.splitMethod === "custom" ? item.assignedTo || null : null
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // create a split bill for this receipt
    await prisma.splitBill.create({
      data: {
        receiptId: receipt.id,
        status: "pending", // Initial status
      },
    });

    // Revalidate dashboard path to show the new receipt
    revalidatePath('/dashboard');

    // Return the receipt data and redirect to review page
    return { 
      success: true, 
      receipt, 
      redirectUrl: `/upload/review?id=${receipt.id}` 
    };
  } catch (error) {
    console.error("Manual receipt error:", error);
    return { 
      error: error.message || "Failed to save receipt",
      stack: error.stack 
    };
  }
}

export async function updateReceiptItems(data) {
  try {
    // Check user authentication
    const session = await auth();
    if (!session?.user) {
      return { error: "You must be logged in to update receipts" };
    }

    const { receiptId, items, totalAmount, tax, subtotal, restaurant, date } = data;

    // Get the current receipt to verify ownership
    const currentReceipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { items: true }
    });

    if (!currentReceipt) {
      return { error: "Receipt not found" };
    }

    if (currentReceipt.userId !== session.user.id) {
      return { error: "You don't have permission to modify this receipt" };
    }

    // Update receipt and items
    const updatedReceipt = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.item.deleteMany({
        where: { receiptId }
      });

      // Update receipt
      const receipt = await tx.receipt.update({
        where: { id: receiptId },
        data: {
          totalAmount,
          tax,
          subtotal,
          restaurant,
          date,
          items: {
            create: items.map(item => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity
            }))
          }
        },
        include: {
          items: true
        }
      });

      return receipt;
    });

    revalidatePath("/dashboard");
    return { success: true, receipt: updatedReceipt };
  } catch (error) {
    console.error("Receipt update error:", error);
    return { error: error.message || "Failed to update receipt" };
  }
}


// // /app/(app)/upload/actions.js
// "use server";

// import { uploadFile } from "@/libs/file-ops";
// import { parseReceipt } from "@/libs/llamaparse";
// import { prisma } from "@/utils/prisma";
// import { auth } from "@/libs/auth";
// import { revalidatePath } from "next/cache";

// export async function uploadReceiptAction(formData) {
//   try {
//     // Check user authentication
//     const session = await auth();
//     if (!session?.user) {
//       return { error: "You must be logged in to upload receipts" };
//     }

//     // Get file from form data
//     const file = formData.get("file");
//     if (!file) {
//       return { error: "No file provided" };
//     }

//     // Generate a unique filename
//     const timestamp = new Date().getTime();
//     const fileName = `receipt-${timestamp}.${file.type.split('/')[1]}`;

//     // Upload file to R2
//     await uploadFile({
//       key: fileName,
//       folder: session.user.id,
//       body: file,
//     });

//     // Get the public URL of the uploaded file
//     const publicUrl = `${process.env.R2_DEV_URL}/${session.user.id}/${fileName}`;

//     // Process the receipt with LlamaParse (using LVM and Gemini model)
//     const receiptData = await parseReceipt(publicUrl);

//     console.log(receiptData)


//     // Return the parsed data for editing in the form before saving to database
//     return { 
//       success: true, 
//       parsedData: receiptData,
//       imageUrl: publicUrl
//     };
//   } catch (error) {
//     console.error("Receipt upload error:", error);
//     return { error: error.message || "Failed to upload and process receipt" };
//   }
// }

// // Action to handle manual receipt entry or edited parsed receipt
// export async function saveManualReceiptAction(data) {
//   try {
//     // Check user authentication
//     const session = await auth();
//     if (!session?.user) {
//       return { error: "You must be logged in to create receipts" };
//     }

//     // Create receipt and items in the database
//     const receipt = await prisma.receipt.create({
//       data: {
//         userId: session.user.id,
//         image: data.imageUrl || null, // Include image URL if available
//         totalAmount: parseFloat(data.totalAmount) || 0,
//         date: new Date(data.date) || new Date(),
//         restaurant: data.restaurant || "Unknown Restaurant",
//         tax: parseFloat(data.tax) || 0,
//         subtotal: parseFloat(data.subtotal) || 0,
//         items: {
//           create: (data.items || []).map(item => ({
//             name: item.name || "Unknown Item",
//             price: parseFloat(item.price) || 0,
//             quantity: parseInt(item.quantity) || 1,
//             assignedTo: data.splitMethod === "custom" ? item.assignedTo || null : null
//           })),
//         },
//       },
//       include: {
//         items: true,
//       },
//     });

//     // Also create a split bill for this receipt
//     await prisma.splitBill.create({
//       data: {
//         receiptId: receipt.id,
//         status: "pending", // Initial status
//       },
//     });

//     // Revalidate dashboard path to show the new receipt
//     revalidatePath('/dashboard');

//     // Return the receipt data and redirect to review page
//     return { 
//       success: true, 
//       receipt, 
//       redirectUrl: `/upload/review?id=${receipt.id}` 
//     };
//   } catch (error) {
//     console.error("Manual receipt error:", error);
//     return { error: error.message || "Failed to save receipt" };
//   }
// }

