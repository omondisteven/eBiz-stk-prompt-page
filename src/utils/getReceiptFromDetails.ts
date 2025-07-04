// /src/utils/getreceiptfromdetails.ts
export type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

export function getReceiptFromDetails(details: any): string | null {
  if (!details) return null;
  
  // Handle array of CallbackMetadataItem
  if (Array.isArray(details)) {
    for (const item of details) {
      if (isCallbackMetadataItem(item) && isReceiptField(item.Name)) {
        return item.Value?.toString() || null;
      }
    }
  }
  
  // Handle object with nested CallbackMetadataItem array
  if (typeof details === 'object' && !Array.isArray(details)) {
    // Check if this is a Safaricom callback structure
    if (Array.isArray(details.CallbackMetadata?.Item)) {
      for (const item of details.CallbackMetadata.Item) {
        if (isCallbackMetadataItem(item) && isReceiptField(item.Name)) {
          return item.Value?.toString() || null;
        }
      }
    }
    
    // Check flat properties as fallback
    const receiptFields = [
      'MpesaReceiptNumber', 'ReceiptNumber', 
      'receiptNumber', 'mpesaReceiptNumber',
      'receipt_number', 'mpesa_receipt_number'
    ];
    
    for (const field of receiptFields) {
      if (details[field]) {
        return details[field].toString();
      }
    }
  }
  
  return null;
}

// Helper to check if an item matches CallbackMetadataItem type
function isCallbackMetadataItem(item: any): item is CallbackMetadataItem {
  return item && typeof item.Name === 'string' && 
         (typeof item.Value === 'string' || typeof item.Value === 'number');
}

// Helper to check if a field name represents a receipt number
function isReceiptField(name: string): boolean {
  const normalized = name.toLowerCase().replace(/\s/g, '');
  return normalized.includes('receipt') || normalized.includes('mpesareceipt');
}

export function generateRandomReference(): string {
  // Helper to generate random uppercase letters
  const randomLetter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  
  // Helper to generate random numbers with padding
  const randomNumber = (digits: number) => 
    Math.floor(Math.random() * Math.pow(10, digits))
      .toString()
      .padStart(digits, '0');

  return [
    randomLetter() + randomLetter(),  // 2 letters
    randomNumber(2),                  // 2 numbers
    randomLetter(),                   // 1 letter
    randomNumber(2),                  // 2 numbers
    randomLetter() + randomLetter() + randomLetter() // 3 letters
  ].join('');
}
