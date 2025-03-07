'use client';

import { useState } from 'react';
import BillImageGenerator from '../_components/BillImageGenerator';
import { Button } from '@heroui/react';

// Contoh data untuk demo aja
const sampleBillData = {
  billTotals: {
    subtotal: 250000,
    tax: 25000,
    serviceFee: 12500,
    total: 287500,
  },
  people: [
    { name: 'Ariq', amountOwed: 95833 },
    { name: 'Kukuh', amountOwed: 95833 },
    { name: 'Pras', amountOwed: 95834 },
  ],
};

export default function ShareBillPage() {
  const [billName, setBillName] = useState('Makan Siang');
  const [billSummary, setBillSummary] = useState(sampleBillData);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Generate Gambar untuk Tagihan
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Tagihan
            </label>
            <input
              type="text"
              value={billName}
              onChange={(e) => setBillName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Masukkan nama tagihan"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                // In production, we would fetch real data here
                // For demo, we're using the sample data defined above
                console.log('Using sample data for bill');
              }}
              className="bg-indigo-600 text-white"
            >
              Gunakan Tagihan Ini
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <BillImageGenerator billSummary={billSummary} billName={billName} />
        </div>
      </div>
    </div>
  );
}
