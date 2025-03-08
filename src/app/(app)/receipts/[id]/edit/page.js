// /src/app/(app)/receipts/[id]/edit/page.jsx
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/utils/prisma';
import { auth } from '@/libs/auth';
import ReceiptEditor from '@/components/receipts/ReceiptEditor';

export default async function EditReceiptPage({ params }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  const receipt = await prisma.receipt.findUnique({
    where: { id: params.id },
    include: { items: true }
  });
  
  if (!receipt) {
    notFound();
  }
  
  // Check if the user owns this receipt
  if (receipt.userId !== session.user.id) {
    redirect('/dashboard');
  }
  
  return (
    <div>
      <ReceiptEditor receipt={receipt} />
    </div>
  );
}