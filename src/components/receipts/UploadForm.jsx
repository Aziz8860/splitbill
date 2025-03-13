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
    totalAmount: '',
    tax: '',
    subtotal: '',
    items: [{ name: '', price: '', quantity: 1 }],
    splitMethod: 'evenly', // Default to evenly split
    imageUrl: null,
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

  // Function to update the form with parsed data
  const updateFormWithParsedData = (data, imageUrl) => {

    console.log("upadteFormWithParsedData", data)
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
        };
      } else {
        // Otherwise add as a new item
        newItems.push({
          name: newItem.name || '',
          price: newItem.price?.toString() || '',
          quantity: newItem.quantity || 1,
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
    const newSubtotal =
      parseFloat(data.subtotal?.toString() || newTotalAmount) || 0;
    const newTax =
      parseFloat(data.tax?.toString() || receiptData.tax?.toString() || 0) || 0;

    // Update the receipt data state
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
      splitMethod: 'evenly',
      imageUrl: imageUrls[0] || null,
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
    setProcessingStage('Uploading receipt...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const loadingToast = toast.loading('Processing your receipt...');

      setTimeout(
        () => setProcessingStage('Analyzing receipt with AI...'),
        2000
      );

      const result = await uploadReceiptAction(formData);

      toast.dismiss(loadingToast);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Receipt processed successfully!');
        console.log(result.parsedData);
        // Update the form with the parsed data
        if (result.parsedData) {
          updateFormWithParsedData(result.parsedData, result.imageUrl);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process receipt');
    } finally {
      setIsUploading(false);
      setProcessingStage(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsUploading(true);

    try {
      // Format the data for the database
      const formattedData = {
        restaurant: receiptData.restaurant,
        totalAmount: parseFloat(receiptData.totalAmount) || 0,
        date: new Date(receiptData.date),
        tax: parseFloat(receiptData.tax) || 0,
        subtotal: parseFloat(receiptData.subtotal) || 0,
        imageUrl: receiptData.imageUrl,
        items: receiptData.items
          .filter((item) => item.name.trim() !== '')
          .map((item) => ({
            name: item.name,
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
          })),
        splitMethod: receiptData.splitMethod,
      };

      // Save the receipt
      const result = await saveManualReceiptAction(formattedData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Receipt saved successfully!');
        if (result.redirectUrl) {
          router.push(result.redirectUrl);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to save receipt');
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
      console.error('Error accessing camera:', error);
      toast.error('Could not access camera');
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
            This may take up to 15-20 seconds. Please don't close this window.
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
              Restaurant Name
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
              Date
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
                Tax
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
                Total Amount
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
              Split Method
            </label>
            <select
              value={receiptData.splitMethod}
              onChange={(e) =>
                setReceiptData({ ...receiptData, splitMethod: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="evenly">Split Evenly</option>
              <option value="custom">Custom Split</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Items
              </label>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {receiptData.items.map((item, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="w-20">
                  <label className="block text-xs text-gray-500">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(index, 'price', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>

                <div className="w-20">
                  <label className="block text-xs text-gray-500">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, 'quantity', e.target.value)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="h-10 px-2 text-red-600 hover:text-red-800"
                  disabled={receiptData.items.length <= 1}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Calculated total (for reference) */}
          <div className="text-sm text-gray-600">
            Items total: ${calculateTotal()}
            {parseFloat(calculateTotal()) !==
              parseFloat(receiptData.totalAmount) &&
              receiptData.totalAmount && (
                <span className="text-yellow-600 ml-2">
                  (Warning: Different from receipt total)
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
          {isUploading ? 'Saving...' : 'Save Receipt'}
        </button>
      </div>
    </form>
  );
}
