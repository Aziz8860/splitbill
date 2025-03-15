// /src/app/receipts/[id]/page.js
import { prisma } from "@/utils/prisma";
import { auth } from "@/libs/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";

export default async function ReceiptDetailPage({ params }) {
  const session = await auth();
  
  // No longer redirect to login if not authenticated
  // Allow guest users to view receipts as well
  // if (!session?.user) {
  //   redirect("/login");
  // }
  
  const receipt = await prisma.receipt.findUnique({
    where: { id: params.id },
    include: { 
      items: true,
      user: true,
    },
  });
  
  // Check if receipt exists
  if (!receipt) {
    redirect("/dashboard");
  }
  
  // Only check if receipt belongs to user if it's a user-owned receipt and the user is logged in
  if (receipt.userId && session?.user?.id && receipt.userId !== session.user.id) {
    redirect("/dashboard");
  }
  
  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Receipt Details</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Receipt header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-medium">{receipt.restaurant}</h2>
          <p className="text-gray-500 text-sm">
            {format(new Date(receipt.date), "PPP")}
          </p>
        </div>
        
        {/* Receipt image */}
        {receipt.image && (
          <div className="p-4 border-b">
            <div className="aspect-[3/4] relative overflow-hidden rounded-lg">
              <Image
                src={receipt.image}
                alt="Receipt"
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}
        
        {/* Receipt items */}
        <div className="p-4">
          <h3 className="font-medium mb-2">Items</h3>
          <div className="divide-y">
            {receipt.items.map(item => (
              <div key={item.id} className="py-2 flex justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  {item.quantity > 1 && (
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  )}
                </div>
                <p className="text-gray-700">${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Receipt total */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="flex justify-between font-medium">
            <p>Total</p>
            <p>${receipt.totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="mt-6 flex space-x-4">
        <Link
          href={`/receipts/${receipt.id}/review`}
          className="flex-1 py-2 px-4 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700"
        >
          Edit Receipt
        </Link>
        
        <Link
          href={`/receipts/${receipt.id}/split`}
          className="flex-1 py-2 px-4 bg-green-600 text-white text-center rounded-md hover:bg-green-700"
        >
          Split This Bill
        </Link>
        
        <Link
          href="/"
          className="py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}