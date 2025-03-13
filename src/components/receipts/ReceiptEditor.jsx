// /src/components/ReceiptEditor.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateReceiptItems } from '@/app/(app)/receipts/[id]/review/actions';
import html2canvas from 'html2canvas';
import Image from 'next/image';

export default function ReceiptEditor({ receipt, isNewReceipt = false }) {
  const router = useRouter();
  const receiptRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);

  // Process data - since there are assignedTo values, this should be a custom split
  const hasAssignments = receipt?.items?.some(
    (item) => item.assignedTo && item.assignedTo.length > 0
  );
  const correctSplitMethod = hasAssignments
    ? 'custom'
    : receipt?.splitMethod || 'evenly';

  // Initialize state with corrected values
  const [items, setItems] = useState(receipt?.items || []);
  const [totalAmount, setTotalAmount] = useState(receipt?.totalAmount || 0);
  const [tax, setTax] = useState(receipt?.tax || 0);
  const [restaurant, setRestaurant] = useState(receipt?.restaurant || '');
  const [date, setDate] = useState(
    receipt?.date
      ? new Date(receipt.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [splitMethod, setSplitMethod] = useState(correctSplitMethod);

  // Identify unique person IDs from the assignments
  const [people, setPeople] = useState(() => {
    if (receipt?.people && receipt.people.length > 0) {
      return receipt.people;
    } else if (hasAssignments) {
      // Extract unique person IDs from all item assignments
      const uniquePersonIds = new Set();
      receipt.items.forEach((item) => {
        if (item.assignedTo && Array.isArray(item.assignedTo)) {
          item.assignedTo.forEach((personId) => uniquePersonIds.add(personId));
        }
      });

      // Create people objects with extracted IDs
      return Array.from(uniquePersonIds).map((id) => ({
        id: id,
        name: `Person ${id.substring(0, 5)}`, // Use part of the ID as a placeholder name
      }));
    }
    return [];
  });

  // Log receipt data for debugging
  // useEffect(() => {
  //   console.log('Receipt data:', receipt);
  //   console.log('Split method (corrected):', splitMethod);
  //   console.log('People (extracted):', people);
  //   console.log('Items:', items);
  // }, []);

  // Calculate subtotal based on items
  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  // Update total when items change
  useEffect(() => {
    const subtotal = calculateSubtotal();
    setTotalAmount(parseFloat((subtotal + tax).toFixed(2)));
  }, [items, tax]);

  // Get person name by ID
  const getPersonName = (personId) => {
    if (!people || !Array.isArray(people))
      return `Person ${personId.substring(0, 5)}`;

    // Find by ID
    const person = people.find((p) => p.id === personId);
    if (person) {
      return person.name;
    }

    // Fallback to truncated ID
    return `Person ${personId.substring(0, 5)}`;
  };

  // Calculate what each person needs to pay
  const calculatePersonAmounts = () => {
    if (splitMethod === 'evenly') {
      // For even split, everyone pays the same amount
      const perPersonAmount = totalAmount / (people.length || 1);
      return people.map((person) => ({
        id: person.id,
        name: person.name,
        amount: perPersonAmount,
      }));
    } else {
      // For custom split, calculate based on assigned items
      const personAmounts = {};

      // Initialize amounts for each person
      people.forEach((person) => {
        personAmounts[person.id] = {
          id: person.id,
          name: person.name,
          amount: 0,
        };
      });

      // Calculate item costs per person
      items.forEach((item) => {
        const itemTotal = item.price * item.quantity;

        if (
          item.assignedTo &&
          Array.isArray(item.assignedTo) &&
          item.assignedTo.length > 0
        ) {
          // Split this item's cost among assigned people
          const perPersonCost = itemTotal / item.assignedTo.length;

          item.assignedTo.forEach((personId) => {
            if (personAmounts[personId]) {
              personAmounts[personId].amount += perPersonCost;
            }
          });
        } else {
          // If no one is assigned, split evenly among all people
          const perPersonCost = itemTotal / (people.length || 1);

          people.forEach((person) => {
            personAmounts[person.id].amount += perPersonCost;
          });
        }
      });

      // Convert to array and sort by name
      return Object.values(personAmounts).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    }
  };

  // Get the person amounts
  const personAmounts = calculatePersonAmounts();

  // Save as image function
  const saveAsImage = async () => {
    if (!receiptRef.current) return;

    try {
      setIsLoading(true);
      setError('');

      // Hide the buttons during capture
      const buttonsContainer = document.querySelector('.buttons-container');
      if (buttonsContainer) buttonsContainer.style.display = 'none';

      // Capture the receipt as an image
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // Higher resolution
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // Show the buttons again
      if (buttonsContainer) buttonsContainer.style.display = 'flex';

      // Convert to image URL
      const image = canvas.toDataURL('image/png');
      setImageUrl(image);

      // Save receipt to database
      await handleSave();
    } catch (err) {
      setError(err.message || 'Failed to save image');
    } finally {
      setIsLoading(false);
    }
  };

  // Share to WhatsApp
  const shareToWhatsApp = () => {
    // Create a message with receipt details
    const message =
      `Receipt from ${restaurant} on ${date}\n` +
      `Total: $${totalAmount.toFixed(2)}\n` +
      `Split method: ${
        splitMethod === 'custom' ? 'Custom Split' : 'Split Evenly'
      }\n\n` +
      `Who must pay:\n` +
      personAmounts
        .map((person) => `${person.name}: $${person.amount.toFixed(2)}`)
        .join('\n');

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp with the message
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  // Handle save (now just saves to database without redirecting)
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
        date: new Date(date),
        splitMethod,
        people,
      });

      if (result.error) {
        setError(result.error);
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
        {isNewReceipt ? 'Review Receipt' : 'Receipt Details'}
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div ref={receiptRef} className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-purple-500 to-purple-900 text-transparent bg-clip-text">
          <div className="flex flex-row items-center justify-center">
            <Image
              src="/logo-splitbill.svg"
              alt="Logo"
              width={26}
              height={26}
              priority
            />
            <p className="ml-2">Splitbill</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant/Store
            </label>
            <div className="p-2 border rounded bg-gray-50">{restaurant}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <div className="p-2 border rounded bg-gray-50">{date}</div>
          </div>
        </div>

        {/* Add Split Method Display */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Split Method
            </label>
            <div className="text-sm font-medium bg-blue-100 text-blue-800 rounded-full px-3 py-1">
              {splitMethod === 'custom' ? 'Custom Split' : 'Split Evenly'}
            </div>
          </div>

          {/* Display People List for Custom Split */}
          {splitMethod === 'custom' && people && people.length > 0 && (
            <div className="mt-2 mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Participants:
              </h3>
              <div className="flex flex-wrap gap-2">
                {people.map((person, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 rounded-full px-3 py-1 text-sm"
                  >
                    {person.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Items</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-2 px-3">Item Name</th>
                  <th className="text-right py-2 px-3">Price</th>
                  <th className="text-right py-2 px-3">Qty</th>
                  <th className="text-right py-2 px-3">Total</th>
                  {splitMethod === 'custom' && people && people.length > 0 && (
                    <th className="text-left py-2 px-3">Assigned To</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-t">
                    <td className="py-2 px-3">
                      <div className="p-1">{item.name}</div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="p-1">${item.price.toFixed(2)}</div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="p-1">{item.quantity}</div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    {splitMethod === 'custom' &&
                      people &&
                      people.length > 0 && (
                        <td className="py-2 px-3">
                          {item.assignedTo &&
                          Array.isArray(item.assignedTo) &&
                          item.assignedTo.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.assignedTo.map((personId, idx) => (
                                <span
                                  key={idx}
                                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                                >
                                  {getPersonName(personId)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              Not assigned
                            </span>
                          )}
                        </td>
                      )}
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={
                        splitMethod === 'custom' && people && people.length > 0
                          ? '5'
                          : '4'
                      }
                      className="py-4 text-center text-gray-500"
                    >
                      No items in this receipt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Who Pays What Section */}
        {people && people.length > 0 && (
          <div className="border-t pt-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">Who Must Pay</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personAmounts.map((person) => (
                  <div
                    key={person.id}
                    className="bg-white p-3 rounded-lg shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{person.name}</span>
                      <span className="text-lg font-bold text-green-600">
                        ${person.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Subtotal:</span>
            <span>${calculateSubtotal().toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Tax:</span>
            <span>${tax.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center mb-2 font-bold text-lg">
            <span>Total:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="w-full mt-8">
          {/* Dashed line */}
          <div className="border-t-2 border-dashed border-gray-300"></div>

          {/* Gray small text below the line */}
          <div className="text-sm text-gray-500 mt-2 text-center">
            © Bill splited by splitbill
            <br />
            https://splitbill-beryl.vercel.app/
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mb-6 buttons-container">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
        >
          Back
        </button>
        <button
          onClick={shareToWhatsApp}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Share to WhatsApp
        </button>
        <button
          onClick={saveAsImage}
          disabled={isLoading}
          className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          {isLoading ? 'Processing...' : 'Save as Image'}
        </button>
      </div>

      {/* Image Preview */}
      {imageUrl && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Image Preview</h2>
          <div className="border rounded-lg p-2 bg-gray-50">
            <img
              src={imageUrl}
              alt="Receipt"
              className="max-w-full h-auto rounded"
            />
          </div>
          <div className="mt-2 text-center">
            <a
              href={imageUrl}
              download={`receipt-${restaurant}-${date}.png`}
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Download Image
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
