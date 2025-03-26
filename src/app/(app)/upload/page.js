// /src/app/(app)/upload/page.jsx
import { redirect } from 'next/navigation';
import UploadForm from '@/components/receipts/UploadForm';
import { Toaster } from 'react-hot-toast';

export default async function UploadPage() {

  return (
    <div className="max-w-md mx-auto p-4">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-bold mb-6">Upload Receipt</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600 mb-6">
          Upload gambar receipt atau masukkan rincian secara manual untuk bagi
          bagi tagihannya.
        </p>

        <UploadForm />
      </div>
    </div>
  );
}
