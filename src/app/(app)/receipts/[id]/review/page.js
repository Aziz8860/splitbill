// /src/app/(app)/upload/review/page.jsx
import { redirect } from 'next/navigation';
import { prisma } from '@/utils/prisma';
import { auth } from '@/libs/auth';
import ReceiptEditor from '@/components/receipts/ReceiptEditor';

export default async function ReviewReceiptPage({ params }) {
  const session = await auth();

  // if (!session?.user) {
  //   redirect('/login');
  // }

  // Await params before using it
  const resolvedParams = await params;
  const { id } = resolvedParams;

  // Get the receipt with items
  const receipt = await prisma.receipt.findUnique({
    where: { id: id },
    select: {
      id: true,
      restaurant: true,
      date: true,
      totalAmount: true,
      tax: true,
      subtotal: true,
      splitMethod: true,
      participants: true,
      currency: true,
      paymentMethod: true,
      accountNumber: true,
      accountName: true,
      userId: true,
      items: {
        select: {
          id: true,
          name: true,
          price: true,
          quantity: true,
          assignedTo: true,
        },
      },
    },
  });

  if (!receipt || receipt.userId !== session.user.id) {
    redirect('/dashboard');
  }

  // Get all unique person IDs from item assignments
  const personIds = new Set();
  receipt.items.forEach((item) => {
    if (item.assignedTo) {
      try {
        const assignedTo =
          typeof item.assignedTo === 'string'
            ? JSON.parse(item.assignedTo)
            : item.assignedTo;

        if (Array.isArray(assignedTo)) {
          assignedTo.forEach((id) => personIds.add(id));
        }
      } catch (error) {
        console.error('Error parsing assignedTo:', error);
      }
    }
  });

  // Fetch actual person data from the database
  const peopleData = await prisma.person.findMany({
    where: {
      id: { in: Array.from(personIds) },
    },
  });

  console.log('Receipt data fetched:', {
    receiptId: receipt.id,
    splitMethod: receipt.splitMethod,
    hasParticipants: !!receipt.participants,
    participantsRaw: receipt.participants,
    personIdsFromItems: Array.from(personIds), 
    peopleDataLength: peopleData.length
  });

  // Process the receipt data with proper people information
  const processedReceipt = {
    ...receipt,
    // Ensure splitMethod is set (default to 'evenly' if not specified)
    splitMethod: receipt.splitMethod || 'evenly',

    // Use fetched people data
    people: peopleData,

    // Process item assignments for display
    items: receipt.items.map((item) => {
      let parsedAssignedTo = [];

      if (item.assignedTo) {
        try {
          parsedAssignedTo =
            typeof item.assignedTo === 'string'
              ? JSON.parse(item.assignedTo)
              : item.assignedTo;
        } catch (error) {
          console.error('Error parsing assignedTo:', error);
        }
      }

      return {
        ...item,
        assignedTo: parsedAssignedTo,
      };
    }),
  };

  return (
    <div>
      <ReceiptEditor receipt={processedReceipt} isNewReceipt={true} />
    </div>
  );
}
