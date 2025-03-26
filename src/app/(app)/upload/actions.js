// /app/(app)/upload/actions.js
'use server';

import { uploadFile } from '@/libs/file-ops';
import { parseReceipt } from '@/libs/llamaparse';
import { prisma } from '@/utils/prisma';
import { auth } from '@/libs/auth';
import { revalidatePath } from 'next/cache';


export async function uploadReceiptAction(formData) {
  try {
    // Check user authentication
    const session = await auth();
    // We'll handle both logged-in and guest users
    const isGuest = !session?.user;

    // Get file from form data
    const file = formData.get('file');
    if (!file) {
      return { error: 'File tidak ditemukan' };
    }

    // Generate a unique filename
    const timestamp = new Date().getTime();
    const fileExt = file.type.split('/')[1] || 'jpg';
    const fileName = `receipt-${timestamp}.${fileExt}`;

    let publicUrl;

    if (isGuest) {
      // For guest users, use a temporary folder with randomness for security
      const randomString = Math.random().toString(36).substring(2, 10);
      const guestFolder = `guest-${timestamp}-${randomString}`;
      
      await uploadFile({
        key: fileName,
        folder: guestFolder,
        body: file,
      });

      // Get the public URL of the uploaded file for guests
      publicUrl = `${process.env.R2_DEV_URL}/${guestFolder}/${fileName}`;
    } else {
      // For logged in users, use their ID as the folder
      await uploadFile({
        key: fileName,
        folder: session.user.id,
        body: file,
      });

      // Get the public URL of the uploaded file
      publicUrl = `${process.env.R2_DEV_URL}/${session.user.id}/${fileName}`;
    }

    // Process the receipt with LlamaParse (using LVM and Gemini model)
    const receiptData = await parseReceipt(publicUrl);

    // Validate the parsed data
    if (!receiptData || typeof receiptData !== 'object') {
      return {
        error: 'Data tidak valid. Layanan parsing receipt gagal',
        debug: { receiptData },
      };
    }

    // Ensure items array is properly formatted
    const formattedData = {
      ...receiptData,
      items: Array.isArray(receiptData.items)
        ? receiptData.items.map((item) => ({
            name: item.name || 'Unknown Item',
            price:
              typeof item.price === 'number'
                ? item.price
                : parseFloat(item.price || 0) || 0,
            quantity:
              typeof item.quantity === 'number'
                ? item.quantity
                : parseInt(item.quantity || 1) || 1,
          }))
        : [],
      // Format date if it's a Date object
      date:
        receiptData.date instanceof Date
          ? receiptData.date.toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      // Ensure numeric values
      totalAmount:
        typeof receiptData.totalAmount === 'number'
          ? receiptData.totalAmount
          : parseFloat(receiptData.totalAmount || 0) || 0,
      tax:
        typeof receiptData.tax === 'number'
          ? receiptData.tax
          : parseFloat(receiptData.tax || 0) || 0,
      subtotal:
        typeof receiptData.subtotal === 'number'
          ? receiptData.subtotal
          : parseFloat(receiptData.subtotal || 0) || 0,
    };

    // Return the parsed data for editing in the form before saving to database
    return {
      success: true,
      parsedData: formattedData,
      imageUrl: publicUrl,
      isGuest: isGuest,
    };
  } catch (error) {
    console.error('Upload receipt gagal:', error);
    return {
      error: error.message || 'Gagal upload dan memproses receipt',
      stack: error.stack,
    };
  }
}


// Action to handle submit
// In saveManualReceiptAction, update the formatting of data:
export async function saveManualReceiptAction(data) {
  try {
    // Check user authentication
    const session = await auth();
    // Allow non-logged in users to proceed
    // Instead of returning an error, we'll continue with a null userId for guests

    // Validate the input data
    if (!data.restaurant || !data.date) {
      return {
        error: 'Nama tempat tagihan dan tanggal harus diisi',
      };
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return { error: 'Setidaknya, tambahkan 1 barang atau item' };
    }

    // For both split methods, process people
    const peopleMap = {};

    if (Array.isArray(data.people)) {
      // Create people records if they don't exist - only for logged in users
      if (session?.user) {
        for (const personData of data.people) {
          if (personData.name) {
            let person = await prisma.person.findFirst({
              where: {
                userId: session.user.id,
                name: personData.name,
              },
            });

            // Create if not exists
            if (!person) {
              person = await prisma.person.create({
                data: {
                  userId: session.user.id,
                  name: personData.name,
                },
              });
            }

            // Map the index to the ID
            peopleMap[data.people.indexOf(personData)] = person.id;
          }
        }
      } else {
        // For guest users, create temporary person IDs
        data.people.forEach((person, index) => {
          if (person.name) {
            // Create a temporary ID format for guests
            peopleMap[index] = `guest-${Date.now()}-${index}`;
          }
        });
      }
    }

    // Process receipt items
    const itemsData = (data.items || []).map((item) => {
      // Process assignedTo for custom split or evenly split
      let assignedTo = null;

      if (
        data.splitMethod === 'custom' &&
        item.assignedTo &&
        Array.isArray(item.assignedTo)
      ) {
        // Convert index-based assignments to ID-based assignments
        assignedTo = item.assignedTo
          .map((idx) => peopleMap[idx])
          .filter((id) => id);

        // Store as JSON
        if (assignedTo.length > 0) {
          assignedTo = JSON.stringify(assignedTo);
        } else {
          assignedTo = null;
        }
      } else if (
        data.splitMethod === 'evenly' &&
        data.people &&
        data.people.length > 0
      ) {
        // For evenly split, assign all people to each item
        const allPeopleIds = Object.values(peopleMap).filter((id) => id);
        if (allPeopleIds.length > 0) {
          assignedTo = JSON.stringify(allPeopleIds);
        }
      }

      return {
        name: item.name || 'Unknown Item',
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        assignedTo,
      };
    });

    // Prepare receipt data
    const baseReceiptData = {
      image: data.imageUrl || null,
      totalAmount: parseFloat(data.totalAmount) || 0,
      date: new Date(data.date) || new Date(),
      restaurant: data.restaurant || 'Unknown Restaurant',
      tax: parseFloat(data.tax) || 0,
      subtotal: parseFloat(data.subtotal) || 0,
      splitMethod: data.splitMethod || 'evenly',
      currency: data.currency || 'USD',
      paymentMethod: data.paymentMethod || 'Cash',
      accountNumber: data.accountNumber || null,
      accountName: data.accountName || null,
      // Store participants as JSON
      participants:
        data.people && data.people.length > 0
          ? JSON.stringify(
              data.people.map((person, index) => ({
                id: peopleMap[index],
                name: person.name,
              }))
            )
          : null,
      items: {
        create: itemsData,
      },
    };

    // Create receipt with proper user relation handling
    let receipt;
    
    if (session?.user?.id) {
      // For logged-in users, connect the receipt to their user record
      receipt = await prisma.receipt.create({
        data: {
          ...baseReceiptData,
          user: {
            connect: {
              id: session.user.id
            }
          }
        },
        include: {
          items: true,
        },
      });
    } else {
      // For guest users, create receipt without a user connection
      receipt = await prisma.receipt.create({
        data: baseReceiptData,
        include: {
          items: true,
        },
      });
    }

    console.log('Data orang sebelum menyimpan ke database:', data.people);

    // create a split bill for this receipt
    await prisma.splitBill.create({
      data: {
        receiptId: receipt.id,
        status: 'pending', // Initial status
      },
    });

    // Revalidate dashboard path to show the new receipt
    revalidatePath('/dashboard');

    // Return the receipt data and redirect to review page
    return {
      success: true,
      receipt,
      redirectUrl: `receipts/${receipt.id}/review/`,
    };
  } catch (error) {
    console.error('Manual receipt error:', error);
    return {
      error: error.message || 'Gagal menyimpan receipt',
      stack: error.stack,
    };
  }
}