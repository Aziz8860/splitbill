import { prisma } from '@/utils/prisma';

export async function getData() {
  const [users, items, receipts, totalPrice] = await prisma.$transaction([
    prisma.user.count(),
    prisma.item.count(),
    prisma.receipt.count(),
    prisma.item.aggregate({
      _sum: {
        price: true,
      },
    }),
  ]);

  return {
    user: users,
    item: items,
    receipt: receipts,
    price: Math.round(totalPrice._sum.price) || 0, // Handle case where no items exist
  };
}
