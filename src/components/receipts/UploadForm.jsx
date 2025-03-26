'use client';

import { useState, useRef, useEffect } from 'react';
import {
  uploadReceiptAction,
  saveManualReceiptAction,
} from '@/app/(app)/upload/actions';
import {
  CameraIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function UploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [processingStage, setProcessingStage] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [usingCamera, setUsingCamera] = useState(false);
  const [receiptData, setReceiptData] = useState({
    restaurant: '',
    date: new Date().toISOString().split('T')[0],
    totalAmount: 0,
    tax: 0,
    subtotal: 0,
    items: [{ name: '', price: '', quantity: 1 }],
    splitMethod: 'evenly', // Default to evenly split
    imageUrl: null,
    people: [{ name: '' }], // Add this line to store people
    currency: 'IDR', // Default currency
    paymentMethod: 'Cash', // Default payment method
    accountNumber: '', // Account number for bank transfers
    accountName: '', // Account name for bank transfers
  });

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();

  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Helper function to get currency symbol
  const getCurrencySymbol = (currencyCode) => {
    const currencySymbols = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      IDR: 'Rp',
      SGD: 'S$',
      AUD: 'A$',
      CAD: 'C$',
    };
    return currencySymbols[currencyCode] || currencyCode;
  };

  // Helper function to format number with dots for thousands
  const formatNumberWithDots = (number) => {
    // Convert to string with 2 decimal places
    const numStr = parseFloat(number || 0).toFixed(2);
    // Split into integer and decimal parts
    const [intPart, decPart] = numStr.split('.');
    // Add dots to integer part
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // Return formatted number with decimal part
    return `${formattedInt},${decPart}`;
  };

  // Function to update the form with parsed data
  const updateFormWithParsedData = (data, imageUrl) => {
    // Create a map of existing items for easy lookup
    const existingItemsMap = {};
    receiptData.items.forEach((item) => {
      if (item.name.trim() !== '') {
        const key = item.name.toLowerCase().trim();
        existingItemsMap[key] = {
          index: receiptData.items.indexOf(item),
          item: item,
        };
      }
    });

    // Process new items from parsed data
    let newItems = [...receiptData.items];

    // Filter out empty items before adding new ones
    if (
      newItems.length === 1 &&
      newItems[0].name === '' &&
      newItems[0].price === ''
    ) {
      newItems = [];
    }

    // Add or update items
    (data.items || []).forEach((newItem) => {
      const key = newItem.name.toLowerCase().trim();

      // If this item already exists, update the quantity
      if (existingItemsMap[key]) {
        const index = existingItemsMap[key].index;
        const existingQuantity = parseInt(newItems[index].quantity) || 0;
        const newQuantity = parseInt(newItem.quantity) || 1;

        newItems[index] = {
          ...newItems[index],
          quantity: existingQuantity + newQuantity,
          // Ensure assignedTo exists and is an array
          assignedTo: newItems[index].assignedTo || [],
        };
      } else {
        // Otherwise add as a new item with assignedTo as an empty array
        newItems.push({
          name: newItem.name || '',
          price: newItem.price?.toString() || '',
          quantity: newItem.quantity || 1,
          assignedTo: [], // Initialize assignedTo as empty array
        });
      }
    });

    // Update restaurant name if not already set
    const restaurant = receiptData.restaurant || data.restaurant || '';

    // Add or update image URL
    let imageUrls = previewUrls;
    if (imageUrl && !imageUrls.includes(imageUrl)) {
      imageUrls = [...imageUrls, imageUrl];
    }

    // Calculate totals
    const newTotalAmount = calculateTotalFromItems(newItems);
    const newSubtotal = data.subtotal || newTotalAmount || 0;

    const newTax = data.tax || receiptData.tax || 0 || 0;

    // Update the receipt data state with empty people array if not exists
    setReceiptData({
      restaurant: restaurant,
      date: data.date
        ? new Date(data.date).toISOString().split('T')[0]
        : receiptData.date,
      totalAmount: newTotalAmount.toString(),
      tax: (parseFloat(receiptData.tax) + newTax).toString(),
      subtotal: (
        parseFloat(receiptData.subtotal || 0) + newSubtotal
      ).toString(),
      items: newItems,
      splitMethod: receiptData.splitMethod, // Keep current split method
      imageUrl: imageUrls[0] || null,
      // Make sure to keep the current people array or initialize a new one
      people: receiptData.people || [{ name: '' }],
      currency: data.currency || receiptData.currency,
      paymentMethod: data.paymentMethod || receiptData.paymentMethod,
      accountNumber: data.accountNumber || receiptData.accountNumber,
      accountName: data.accountName || receiptData.accountName,
    });

    setPreviewUrls(imageUrls);
  };

  // Calculate total from items
  const calculateTotalFromItems = (items) => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return sum + price * quantity;
    }, 0);
  };

  async function handleFileUpload(file) {
    setIsUploading(true);
    setProcessingStage('Memproses receipt...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const loadingToast = toast.loading('Memproses receipt...');

      setTimeout(
        () => setProcessingStage('Memproses receipt dengan AI...'),
        2000
      );

      const result = await uploadReceiptAction(formData);

      toast.dismiss(loadingToast);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Receipt berhasil diproses!');

        // Update the form with the parsed data
        if (result.parsedData) {
          updateFormWithParsedData(result.parsedData, result.imageUrl);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal memproses receipt');
    } finally {
      setIsUploading(false);
      setProcessingStage(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsUploading(true);

    try {
      console.log('Submitting receipt data:', {
        people: receiptData.people,
        splitMethod: receiptData.splitMethod,
        items: receiptData.items.map((item) => ({
          ...item,
          assignedTo: item.assignedTo,
        })),
      });

      // Format the data for the database
      const formattedData = {
        restaurant: receiptData.restaurant,
        date: receiptData.date,
        totalAmount: parseFloat(receiptData.totalAmount),
        tax: parseFloat(receiptData.tax || 0),
        subtotal: parseFloat(receiptData.subtotal || 0),
        items: receiptData.items.map((item) => ({
          name: item.name,
          price: parseFloat(item.price),
          quantity: parseInt(item.quantity || 1),
          assignedTo: item.assignedTo || [],
        })),
        people: receiptData.people,
        splitMethod: receiptData.splitMethod,
        currency: receiptData.currency,
        paymentMethod: receiptData.paymentMethod,
        accountNumber: receiptData.accountNumber,
        accountName: receiptData.accountName,
      };

      console.log('Formatted data for saving:', {
        people: formattedData.people,
        peopleCount: formattedData.people?.length,
        splitMethod: formattedData.splitMethod,
      });

      // Save the receipt
      const result = await saveManualReceiptAction(formattedData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Receipt berhasil disimpan!');
        if (result.redirectUrl) {
          router.push(result.redirectUrl);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Gagal menyimpan receipt');
    } finally {
      setIsUploading(false);
    }
  }

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files?.length > 0) {
      const file = files[0]; // Process one file at a time
      const url = URL.createObjectURL(file);

      // Add the preview URL
      setPreviewUrls((prev) => [...prev, url]);

      // Process the file
      handleFileUpload(file);
    }
  };

  const startCamera = async () => {
    try {
      setUsingCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error mengakses kamera:', error);
      toast.error('Tidak dapat mengakses kamera');
      setUsingCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setUsingCamera(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const file = new File([blob], 'receipt.jpg', {
              type: 'image/jpeg',
            });

            // Add the preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrls((prev) => [...prev, url]);

            stopCamera();
            handleFileUpload(file);
          }
        },
        'image/jpeg',
        0.95
      );
    }
  };

  // Add a new item to the items array
  const addItem = () => {
    setReceiptData({
      ...receiptData,
      items: [...receiptData.items, { name: '', price: '', quantity: 1 }],
    });
  };

  // Update an item in the items array
  const updateItem = (index, field, value) => {
    const updatedItems = [...receiptData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    setReceiptData({
      ...receiptData,
      items: updatedItems,
    });

    // Recalculate total if needed
    if (field === 'price' || field === 'quantity') {
      const newTotal = calculateTotalFromItems(updatedItems);
      setReceiptData((prev) => ({
        ...prev,
        items: updatedItems,
        totalAmount: newTotal.toFixed(2),
      }));
    }
  };

  // Remove an item from the items array
  const removeItem = (index) => {
    const updatedItems = receiptData.items.filter((_, i) => i !== index);
    const newTotal = calculateTotalFromItems(updatedItems);

    setReceiptData({
      ...receiptData,
      items: updatedItems,
      totalAmount: newTotal.toFixed(2),
    });
  };

  // Add a new person to the people array
  const addPerson = () => {
    setReceiptData({
      ...receiptData,
      people: [...receiptData.people, { name: '' }],
    });
  };

  // Update a person in the people array
  const updatePerson = (index, name) => {
    const updatedPeople = [...receiptData.people];
    updatedPeople[index] = { name };
    setReceiptData({
      ...receiptData,
      people: updatedPeople,
    });
  };

  // Remove a person from the people array
  const removePerson = (index) => {
    // Don't remove if it's the last person
    if (receiptData.people.length <= 1) return;

    const updatedPeople = receiptData.people.filter((_, i) => i !== index);

    // Also remove this person from any item assignments
    const updatedItems = receiptData.items.map((item) => {
      if (item.assignedTo) {
        // Create new assignedTo array without the removed person
        const newAssignedTo = Array.isArray(item.assignedTo)
          ? item.assignedTo.filter(
              (personIndex) =>
                personIndex !== index && personIndex < updatedPeople.length
            )
          : [];
        return { ...item, assignedTo: newAssignedTo };
      }
      return item;
    });

    setReceiptData({
      ...receiptData,
      people: updatedPeople,
      items: updatedItems,
    });
  };

  // Toggle assignment of an item to a person
  const toggleItemAssignment = (itemIndex, personIndex) => {
    const updatedItems = [...receiptData.items];
    const item = updatedItems[itemIndex];

    // Initialize assignedTo as an array if it doesn't exist
    if (!item.assignedTo || !Array.isArray(item.assignedTo)) {
      item.assignedTo = [];
    }

    // Toggle the assignment - add or remove the person index
    if (item.assignedTo.includes(personIndex)) {
      item.assignedTo = item.assignedTo.filter((idx) => idx !== personIndex);
    } else {
      item.assignedTo = [...item.assignedTo, personIndex];
    }

    updatedItems[itemIndex] = item;
    setReceiptData({
      ...receiptData,
      items: updatedItems,
    });
  };

  // Remove a preview image
  const removePreviewImage = (index) => {
    const updatedPreviews = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(updatedPreviews);

    // Update the imageUrl in receiptData if needed
    if (index === 0 && updatedPreviews.length > 0) {
      setReceiptData({
        ...receiptData,
        imageUrl: updatedPreviews[0],
      });
    } else if (updatedPreviews.length === 0) {
      setReceiptData({
        ...receiptData,
        imageUrl: null,
      });
    }
  };

  // Calculate total from items (for validation)
  const calculateTotal = () => {
    return receiptData.items
      .reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return sum + price * quantity;
      }, 0)
      .toFixed(2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        name="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Camera View */}
      {usingCamera && (
        <div className="relative bg-black rounded-lg overflow-hidden aspect-[3/4]">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="absolute bottom-4 w-full flex justify-center space-x-4">
            <button
              type="button"
              onClick={captureImage}
              className="p-4 bg-white rounded-full"
              disabled={isUploading}
            >
              <div className="w-12 h-12 rounded-full border-4 border-gray-600"></div>
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="p-3 bg-red-500 text-white rounded-full"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Preview Images - Grid for multiple images */}
      {previewUrls.length > 0 && !usingCamera && (
        <div className="mt-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Receipt preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePreviewImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  disabled={isUploading}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Status */}
      {isUploading && processingStage && (
        <div
          className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded relative"
          role="alert"
        >
          <div className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="font-medium">{processingStage}</span>
          </div>
          <p className="text-sm mt-2">
            Proses ini mungkin memakan waktu 15-20 detik. Jangan tutup jendela
            ini.
          </p>
        </div>
      )}

      {/* Upload/Scan Buttons - Always show unless camera is active */}
      {!usingCamera && !isUploading && (
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 py-2 px-4 ${
              isMobile
                ? 'bg-white border border-gray-300'
                : 'bg-primary border border-transparent text-white hover:bg-primary-600'
            } rounded-md shadow-sm text-sm font-medium ${
              isMobile ? 'text-gray-700 hover:bg-gray-50' : 'text-white'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-300`}
            disabled={isUploading}
          >
            <PhotoIcon className="h-5 w-5 inline mr-2" />
            {isMobile ? 'Choose File' : 'Upload Receipt'}
          </button>

          {isMobile && (
            <button
              type="button"
              onClick={startCamera}
              className="flex-1 py-2 px-4 bg-primary border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-300"
              disabled={isUploading}
            >
              <CameraIcon className="h-5 w-5 inline mr-2" />
              Scan Receipt
            </button>
          )}
        </div>
      )}

      {/* Receipt Data Form - Always display */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama Tempat/Restaurant
            </label>
            <input
              type="text"
              value={receiptData.restaurant}
              onChange={(e) =>
                setReceiptData({ ...receiptData, restaurant: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tanggal
            </label>
            <input
              type="date"
              value={receiptData.date}
              onChange={(e) =>
                setReceiptData({ ...receiptData, date: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Subtotal
              </label>
              <input
                type="number"
                step="0.01"
                value={receiptData.subtotal}
                onChange={(e) =>
                  setReceiptData({ ...receiptData, subtotal: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pajak
              </label>
              <input
                type="number"
                step="0.01"
                value={receiptData.tax}
                onChange={(e) =>
                  setReceiptData({ ...receiptData, tax: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Tagihan
              </label>
              <input
                type="number"
                step="0.01"
                value={receiptData.totalAmount}
                onChange={(e) =>
                  setReceiptData({
                    ...receiptData,
                    totalAmount: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mata Uang
            </label>
            <select
              value={receiptData.currency}
              onChange={(e) =>
                setReceiptData({ ...receiptData, currency: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="IDR">IDR (Rp)</option>
              <option value="SGD">SGD (S$)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="CAD">CAD (C$)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Metode Pembayaran
            </label>
            <select
              value={receiptData.paymentMethod}
              onChange={(e) =>
                setReceiptData({
                  ...receiptData,
                  paymentMethod: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              required
            >
              <option value="Cash">Cash</option>
              <option value="BCA">BCA</option>
              <option value="BRI">BRI</option>
              <option value="BNI">BNI</option>
              <option value="Mandiri">Mandiri</option>
              <option value="BSI">BSI</option>
              <option value="Gopay">Gopay</option>
              <option value="Ovo">Ovo</option>
              <option value="ShopeePay">ShopeePay</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nomor Rekening
            </label>
            <input
              type="text"
              value={receiptData.accountNumber}
              onChange={(e) =>
                setReceiptData({
                  ...receiptData,
                  accountNumber: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nama Rekening
            </label>
            <input
              type="text"
              value={receiptData.accountName}
              onChange={(e) =>
                setReceiptData({ ...receiptData, accountName: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Metode Pembagian
            </label>
            <select
              value={receiptData.splitMethod}
              onChange={(e) =>
                setReceiptData({
                  ...receiptData,
                  splitMethod: e.target.value,
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="evenly">Split Sama Rata</option>
              <option value="custom">Custom Split</option>
            </select>
            {/* Show people section for both split methods */}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Partisipan
                </label>
                <button
                  type="button"
                  onClick={addPerson}
                  className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {receiptData.people.map((person, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={person.name}
                      onChange={(e) => updatePerson(index, e.target.value)}
                      placeholder="Person name"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required={receiptData.people.length > 0}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePerson(index)}
                    className="px-2 text-red-600 hover:text-red-800"
                    disabled={receiptData.people.length <= 1}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}

              {receiptData.people.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  Tambah orang untuk membagi tagihan
                </p>
              )}
            </div>
          </div>

          {/* Update the items section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Barang/Item
              </label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {receiptData.items.map((item, itemIndex) => (
              <div key={itemIndex}>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500">
                      Nama Barang/Item
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(itemIndex, 'name', e.target.value)
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="w-20">
                    <label className="block text-xs text-gray-500">Harga</label>
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(itemIndex, 'price', e.target.value)
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="w-20">
                    <label className="block text-xs text-gray-500">
                      Jumlah
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(itemIndex, 'quantity', e.target.value)
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(itemIndex)}
                    className="h-10 px-2 text-red-600 hover:text-red-800"
                    disabled={receiptData.items.length <= 1}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Show assigned people based on split method */}
                {item.name && (
                  <div className="ml-2 mt-1">
                    {receiptData.splitMethod === 'custom' ? (
                      <div className="flex flex-wrap gap-2">
                        {receiptData.people.map(
                          (person, personIndex) =>
                            person.name && (
                              <label
                                key={personIndex}
                                className="inline-flex items-center"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    item.assignedTo &&
                                    Array.isArray(item.assignedTo) &&
                                    item.assignedTo.includes(personIndex)
                                  }
                                  onChange={() =>
                                    toggleItemAssignment(itemIndex, personIndex)
                                  }
                                  className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                />
                                <span className="ml-1 text-sm text-gray-700">
                                  {person.name}
                                </span>
                              </label>
                            )
                        )}
                      </div>
                    ) : receiptData.people.length > 0 ? (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">
                          Split sama rata ke:{' '}
                        </span>
                        {receiptData.people
                          .filter((person) => person.name)
                          .map((person) => person.name)
                          .join(', ')}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Calculated total (for reference) */}
          <div className="text-sm text-gray-600">
            <div className="flex justify-between items-center mb-2">
              <span>Subtotal:</span>
              <span>
                {getCurrencySymbol(receiptData.currency)}
                {formatNumberWithDots(receiptData.subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span>Pajak:</span>
              <span>
                {getCurrencySymbol(receiptData.currency)}
                {formatNumberWithDots(receiptData.tax)}
              </span>
            </div>
            <div className="flex justify-between items-center font-bold">
              <span>Total:</span>
              <span>
                {getCurrencySymbol(receiptData.currency)}
                {formatNumberWithDots(receiptData.totalAmount)}
              </span>
            </div>
            {parseFloat(calculateTotal()) !==
              parseFloat(receiptData.totalAmount) &&
              receiptData.totalAmount && (
                <span className="text-yellow-600 ml-2">
                  (Peringatan: Total berbeda dari total receipt)
                </span>
              )}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isUploading || !receiptData.restaurant}
          className="w-full py-2 px-4 bg-primary border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors duration-300"
        >
          {isUploading ? 'Menyimpan...' : 'Simpan Receipt'}
        </button>
      </div>
    </form>
  );
}
