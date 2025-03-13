// /src/components/ReceiptEditor.jsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateReceiptItems } from '@/app/(app)/receipts/[id]/review/actions';

export default function ReceiptEditor({ receipt, isNewReceipt = false }) {
  const router = useRouter();
  const [items, setItems] = useState(receipt?.items || []);
  const [totalAmount, setTotalAmount] = useState(receipt?.totalAmount || 0);
  const [tax, setTax] = useState(receipt?.tax || 0);
  const [restaurant, setRestaurant] = useState(receipt?.restaurant || '');
  const [date, setDate] = useState(receipt?.date ? new Date(receipt.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate subtotal based on items
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  // Update total when items change
  useEffect(() => {
    const subtotal = calculateSubtotal();
    setTotalAmount(parseFloat((subtotal + tax).toFixed(2)));
  }, [items, tax]);

  // Add a new blank item
  const addItem = () => {
    setItems([...items, { name: '', price: 0, quantity: 1 }]);
  };

  // Remove an item
  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Update an item
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    
    // Convert to appropriate type
    if (field === 'price') {
      value = parseFloat(value) || 0;
    } else if (field === 'quantity') {
      value = parseInt(value) || 1;
    }
    
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Handle save
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const subtotal = calculateSubtotal();
      
      const result = await updateReceiptItems({
        receiptId: receipt.id,
        items,
        totalAmount,
        tax,
        subtotal,
        restaurant,
        date: new Date(date)
      });
      
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError(err.message || 'Failed to save receipt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {isNewReceipt ? 'Review Receipt' : 'Edit Receipt'}
      </h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant/Store
            </label>
            <input
              type="text"
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Items</h2>
            <button
              onClick={addItem}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded text-sm"
            >
              Add Item
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-2 px-3">Item Name</th>
                  <th className="text-right py-2 px-3">Price</th>
                  <th className="text-right py-2 px-3">Qty</th>
                  <th className="text-right py-2 px-3">Total</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        className="w-full p-1 border rounded"
                        placeholder="Item name"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                        className="w-24 p-1 border rounded text-right"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-16 p-1 border rounded text-right"
                        min="1"
                      />
                    </td>
                    <td className="py-2 px-3 text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">
                      No items yet. Click "Add Item" to add items to the receipt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Subtotal:</span>
            <span>${calculateSubtotal().toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Tax:</span>
            <div>
              <input
                type="number"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                className="w-24 p-1 border rounded text-right"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-2 font-bold text-lg">
            <span>Total:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-4">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Saving...' : 'Save Receipt'}
        </button>
      </div>
    </div>
  );
}