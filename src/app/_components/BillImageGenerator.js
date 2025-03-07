'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { formatCurrency } from '../../libs/splitbill';
import { Button } from '@heroui/react';
import { Share } from 'lucide-react';

export default function BillImageGenerator({
  billSummary,
  billName = 'Split Bill',
}) {
  const [imageUrl, setImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareableUrl, setShareableUrl] = useState(null);
  const billRef = useRef(null);

  const { billTotals, people } = billSummary || {
    billTotals: { subtotal: 0, tax: 0, serviceFee: 0, total: 0 },
    people: [],
  };

  const generateImage = async () => {
    if (!billRef.current) return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(billRef.current, { quality: 0.95 });
      setImageUrl(dataUrl);

      // Generate shareable URL with the image
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: dataUrl,
          expiresIn: 86400, // 24 hours in seconds
        }),
      });

      const data = await response.json();
      if (data.url) {
        setShareableUrl(data.url);
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareToWhatsapp = () => {
    if (!shareableUrl) return;

    const text = `Check out our split bill summary: ${shareableUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Bill preview that will be converted to image */}
      <div
        ref={billRef}
        className="p-6 bg-white border border-gray-200 rounded-lg shadow-md w-full max-w-md"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">
            📝 Rekapitulasi Tagihan {billName} 📝
          </h2>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(billTotals.subtotal)}</span>
          </div>

          {billTotals.tax > 0 && (
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>{formatCurrency(billTotals.tax)}</span>
            </div>
          )}

          {billTotals.serviceFee > 0 && (
            <div className="flex justify-between">
              <span>Service Fee:</span>
              <span>{formatCurrency(billTotals.serviceFee)}</span>
            </div>
          )}

          <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
            <span>Total:</span>
            <span>{formatCurrency(billTotals.total)}</span>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">
            💰 Yang Harus Dibayar 💰
          </h3>
          <div className="space-y-1">
            {people.map((person, index) => (
              <div key={index} className="flex justify-between">
                <span>{person.name}:</span>
                <span>{formatCurrency(person.amountOwed)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 mt-4 pt-2 border-t border-gray-200">
          Pakai SplitBill, Biar Siapa Bayar Berapa, Makin Jelas!
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 w-full max-w-md">
        <Button
          onClick={generateImage}
          disabled={isGenerating}
          className="flex-1 bg-indigo-600 text-white"
        >
          {isGenerating ? 'Generating...' : 'Generate Image'}
        </Button>

        {shareableUrl && (
          <Button onClick={shareToWhatsapp} className="bg-green-600 text-white">
            <Share className="w-4 h-4 mr-2" />
            Share to WhatsApp
          </Button>
        )}
      </div>

      {/* Image preview */}
      {imageUrl && (
        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
          <img
            src={imageUrl}
            alt="Bill Summary"
            className="max-w-full h-auto"
          />
        </div>
      )}
    </div>
  );
}
