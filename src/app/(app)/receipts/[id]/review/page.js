// /src/app/(app)/upload/review/page.jsx
import { redirect } from 'next/navigation';
import { prisma } from '@/utils/prisma';
import { auth } from '@/libs/auth';
import ReceiptEditor from '@/components/receipts/ReceiptEditor';

export default async function ReviewReceiptPage( {params} ) {
  const session = await auth();
  
  // if (!session?.user) {
  //   redirect('/login');
  // }
  
  const {id} = params ;
  
  
  const receipt = await prisma.receipt.findUnique({
    where: { id: id },
    include: { items: true }
  });
  
  if (!receipt || receipt.userId !== session.user.id) {
    redirect('/dashboard');
  }
  
  return (
    <div>
      <ReceiptEditor receipt={receipt} isNewReceipt={true} />
    </div>
  );
}