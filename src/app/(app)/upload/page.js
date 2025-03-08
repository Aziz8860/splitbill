// /src/app/(app)/upload/page.jsx
import { auth } from "@/libs/auth";
import { redirect } from "next/navigation";
import UploadForm from "@/components/receipts/UploadForm";
import { Toaster } from "react-hot-toast";

export default async function UploadPage() {
  const session = await auth();
  
  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }
  
  return (
    <div className="max-w-md mx-auto p-4">
      <Toaster position="top-right" />
      
      <h1 className="text-2xl font-bold mb-6">Upload Receipt</h1>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600 mb-6">
          Upload a receipt image or enter details manually to split the bill.
        </p>
        
        <UploadForm />
      </div>
    </div>
  );
}