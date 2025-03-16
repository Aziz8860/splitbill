// /libs/llamaparse.js
export async function parseReceipt(imageUrl) {
  console.log("Parsing receipt from URL:", imageUrl);

  if (!imageUrl) {
    throw new Error("Image URL is missing.");
  }

  if (!process.env.LLAMAPARSE_API_KEY) {
    throw new Error("LLAMAPARSE_API_KEY is not defined in environment variables");
  }

  try {
    // Step 1: Upload the file and get job ID
    const uploadResponse = await uploadFileUrl(imageUrl);
    console.log("Upload response:", uploadResponse);
    const jobId = uploadResponse.id;
    
    if (!jobId) {
      throw new Error("Failed to get job ID from upload response");
    }
    
    // Step 2: Wait for processing to complete (poll the job status)
    const parsedData = await waitForJobCompletion(jobId);
    
    // Step 3: Format the data
    return formatReceiptData(parsedData);
  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw new Error(`Receipt parsing failed: ${error.message}`);
  }
}

async function uploadFileUrl(imageUrl) {
  // Create form data with the URL
  const formData = new FormData();
  formData.append("input_url", imageUrl);
  // Add LVM parsing mode
  formData.append("parse_mode", "parse_page_with_lvm");
  // Set the vendor model to gemini-2.0-flash-001
  formData.append("vendor_multimodal_model_name", "gemini-2.0-flash-001");
  // Add the custom prompt for receipt parsing with explicit instructions for consistent formatting
  formData.append("system_prompt", `You are a receipt parsing assistant. Extract structured data from the receipt markdown.
            Return ONLY a JSON object with the following format:
              {
                "restaurant": "Store Name",
                "date": "YYYY-MM-DD",
                "currency": "USD",
                "totalAmount": 0.00,
                "items": [
                  {
                    "name": "Item Name",
                    "price": 0.00,
                    "quantity": 1
                  }
                ],
                "tax": {
                  "percentage": 0.00,
                  "amount": 0.00
                },
                "subtotal": 0.00
              }
            Important:

            - Include "currency" to differentiate from USD or other currencies, example: "currency":"IDR" if it is IDR.
            - Ensure each item has a proper name, price, and quantity
            - Ensure all numeric values correctly reflect their currency, if IDR "12,000" should be extracted as 12000.00, not 12.00, same as USD if 12.00 it is 12.00.
            - Maintain the tax percentage from the receipt while also calculating the absolute tax amount.
            - Extract all items, ensuring their names, prices, and quantities are accurate.
            - Normalize item names by removing unnecessary special characters.
            - If the quantity is explicitly mentioned, include it; otherwise, default to 1.
            - The subtotal should reflect the total before tax.
            - Extract the store/restaurant name and date accurately.`);
  
  // Make the POST request
  const response = await fetch("https://api.cloud.llamaindex.ai/api/parsing/upload", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.LLAMAPARSE_API_KEY}`,
      "Accept": "application/json"
    },
    body: formData
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LlamaParse upload API error (${response.status}): ${errorText}`);
  }
  
  return await response.json();
}

async function waitForJobCompletion(jobId, maxAttempts = 30, delayMs = 2000) {
  console.log(`Checking status for job: ${jobId}`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await checkJobStatus(jobId);
    console.log(`Job status (attempt ${attempt + 1}/${maxAttempts}):`, status.status);
    
    if (status.status === "SUCCESS") {
      // Get the JSON result
      return await getJobResult(jobId);
    } else if (status.status === "FAILED" || status.status === "failed") {
      throw new Error(`LlamaParse job failed: ${status.error || "Unknown error"}`);
    }
    
    // Wait before the next check
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error(`Job processing timed out after ${maxAttempts} attempts`);
}

async function checkJobStatus(jobId) {
  const response = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${process.env.LLAMAPARSE_API_KEY}`,
      "Accept": "application/json"
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LlamaParse job status API error (${response.status}): ${errorText}`);
  }
  
  return await response.json();
}

async function getJobResult(jobId) {
  const response = await fetch(`https://api.cloud.llamaindex.ai/api/parsing/job/${jobId}/result/markdown`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${process.env.LLAMAPARSE_API_KEY}`,
      "Accept": "application/json"
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LlamaParse result API error (${response.status}): ${errorText}`);
  }
  
  const rawResponse = await response.json();
  
  // Extract JSON from markdown if present
  if (rawResponse.markdown) {
    // The markdown contains a JSON code block, extract the JSON part
    const jsonMatch = rawResponse.markdown.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Error parsing JSON from markdown:", e);
      }
    }
  }
  
  // Return the raw response if we couldn't extract JSON
  return rawResponse;
}


function formatReceiptData(data) {
  try {
    // Try to extract data from the raw response
    let jsonData = data;
    
    // Handle case where data might be nested in a 'response' field or similar
    if (data.response && typeof data.response === 'string') {
      try {
        jsonData = JSON.parse(data.response);
      } catch (e) {
        console.error("Error parsing response field:", e);
      }
    }
    
    // Extract restaurant name from multiple possible fields
    const restaurant = 
      jsonData.restaurant || 
      jsonData.merchant_name || 
      jsonData.store_name || 
      jsonData.vendor || 
      "Unknown Restaurant";
    
    // Handle date
    let date;
    try {
      if (jsonData.date) {
        date = new Date(jsonData.date);
        // Check if date is valid, otherwise use current date
        if (isNaN(date.getTime())) {
          date = new Date();
        }
      } else {
        date = new Date();
      }
    } catch (e) {
      date = new Date();
    }
    
    // Extract items from multiple possible fields and formats
    let items = [];
    const possibleItemsFields = ['items', 'line_items', 'lineItems', 'products'];
    
    for (const field of possibleItemsFields) {
      if (jsonData[field] && Array.isArray(jsonData[field]) && jsonData[field].length > 0) {
        items = jsonData[field].map(item => {
          // Extract item properties from multiple possible fields
          const name = item.name || item.description || item.product || item.item || "Unknown Item";
          
          // Extract price and ensure it's a number
          let price = 0;
          if (item.price !== undefined) {
            price = parseFloat(item.price);
          } else if (item.amount !== undefined) {
            price = parseFloat(item.amount);
          } else if (item.unit_price !== undefined) {
            price = parseFloat(item.unit_price);
          } else if (item.unitPrice !== undefined) {
            price = parseFloat(item.unitPrice);
          }
          
          // Extract quantity and ensure it's a number
          let quantity = 1;
          if (item.quantity !== undefined) {
            quantity = parseInt(item.quantity) || 1;
          } else if (item.qty !== undefined) {
            quantity = parseInt(item.qty) || 1;
          } else if (item.count !== undefined) {
            quantity = parseInt(item.count) || 1;
          }
          
          return {
            name: name.trim(),
            price: isNaN(price) ? 0 : price,
            quantity: isNaN(quantity) ? 1 : quantity,
          };
        });
        
        // Found valid items, so break out of loop
        break;
      }
    }
    
    // Extract tax, subtotal, and total
    const tax = parseFloat(jsonData.tax.amount || jsonData.tax.amount || 0) || 0;
    const subtotal = parseFloat(jsonData.subtotal || jsonData.sub_total || jsonData.subTotal || 0) || 0;
    let totalAmount = parseFloat(jsonData.totalAmount || jsonData.total_amount || jsonData.total || 0) || 0;
    
    // If total is missing but we have subtotal and tax, calculate it
    if (totalAmount === 0 && (subtotal > 0 || tax > 0)) {
      totalAmount = subtotal + tax;
    }
    
    // If we have total but no subtotal or tax, make educated guesses
    if (totalAmount > 0) {
      if (subtotal === 0) {
        // Estimate subtotal from total and tax
        const estimatedSubtotal = tax > 0 ? totalAmount - tax : totalAmount;
        return {
          restaurant,
          date,
          tax,
          subtotal: estimatedSubtotal,
          totalAmount,
          items,
        };
      }
    }
    
    return {
      restaurant,
      date,
      tax,
      subtotal,
      totalAmount,
      items,
    };
  } catch (error) {
    console.error("Error formatting receipt data:", error, "Raw data:", data);
    // Return minimal valid data structure
    return {
      restaurant: "Unknown Restaurant",
      date: new Date(),
      tax: 0,
      subtotal: 0,
      totalAmount: 0,
      items: [],
    };
  }
}