'use server';

import { prisma } from '@/utils/prisma';
import { auth } from '@/libs/auth';
import { revalidatePath } from 'next/cache';

export async function updateReceiptItems(data) {
  try {
    // Check user authentication
    const session = await auth();
    // Allow non-logged in users to update receipts
    // if (!session?.user) {
    //   return { error: 'You must be logged in to update receipts' };
    // }

    const {
      receiptId,
      items,
      totalAmount,
      tax,
      subtotal,
      restaurant,
      date,
      splitMethod,
      people,
      currency,
      paymentMethod,
      accountNumber,
      accountName,
    } = data;

    // Get the current receipt to verify ownership
    const currentReceipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { items: true },
    });

    if (!currentReceipt) {
      return { error: 'Receipt not found' };
    }

    // Only check ownership if this is a user-owned receipt and the session user is trying to edit someone else's receipt
    if (
      currentReceipt.userId &&
      session?.user?.id &&
      currentReceipt.userId !== session.user.id
    ) {
      return { error: 'Kamu tidak punya akses untuk modifikasi receipt ini' };
    }

    // Update receipt and items
    const updatedReceipt = await prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.item.deleteMany({
        where: { receiptId },
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
          splitMethod: splitMethod || 'evenly',
          participants: people && people.length > 0 ? people : undefined,
          currency,
          paymentMethod,
          accountNumber,
          accountName,
          items: {
            create: items.map((item) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              assignedTo: item.assignedTo ? item.assignedTo : undefined,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return receipt;
    });

    revalidatePath(`/receipts/${receiptId}`);
    revalidatePath('/dashboard');
    return { success: true, receipt: updatedReceipt };
  } catch (error) {
    console.error('Update receipt-nya error:', error);
    return { error: error.message || 'Gagal update receipt' };
  }
}
