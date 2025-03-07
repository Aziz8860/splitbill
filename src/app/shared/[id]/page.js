'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@heroui/react';
import { Clock } from 'lucide-react';

export default function SharedBillPage() {
  const { id } = useParams();
  const [imageData, setImageData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSharedImage() {
      try {
        const response = await fetch(`/api/share?id=${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load shared image');
        }

        setImageData(data.imageData);
      } catch (error) {
        console.error('Error fetching shared image:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchSharedImage();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading shared bill...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full p-6 bg-white border border-gray-200 rounded-lg shadow-md text-center">
          <Clock className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {error === 'Shared image has expired' ? 'Link Expired' : 'Error'}
          </h1>
          <p className="text-gray-600 mb-6">
            {error === 'Shared image has expired'
              ? 'This shared bill has expired. Shared bills are only available for 24 hours.'
              : error}
          </p>
          <Button className="bg-indigo-600 text-white">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden mb-4">
          <img
            src={imageData}
            alt="Shared Bill Summary"
            className="w-full h-auto"
          />
        </div>

        <div className="flex justify-between gap-4">
          <Button className="flex-1 bg-indigo-600 text-white">
            <Link href="/">Go to SplitBill</Link>
          </Button>

          <Button
            onClick={() => {
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
                'Check out our split bill!'
              )}`;
              window.open(whatsappUrl, '_blank');
            }}
            className="flex-1 bg-green-600 text-white"
          >
            Share to WhatsApp
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          This shared bill will expire in 24 hours from creation.
        </p>
      </div>
    </div>
  );
}
