import { auth } from '@/libs/auth';
import { prisma } from '@/utils/prisma';
import { HistoryCard } from './history-card';

export const SectionHistory = async () => {
  const session = await auth();
  const receipts = await prisma.receipt.findMany({
    where: {
      userId: session.user.id,
    },
    include: { _count: { select: { items: true } } },
  });

  return (
    <section className="flex flex-col border border-slate-200 rounded-xl p-3 shadow-lg space-y-4">
      <p className="font-bold">Split History</p>
      {receipts.map((item) => {
        return <HistoryCard key={item.id} item={item} />;
      })}
    </section>
  );
};
