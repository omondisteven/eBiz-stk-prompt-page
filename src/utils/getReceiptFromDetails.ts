type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

// Replace the getReceiptFromDetails function with this more robust version
export function getReceiptFromDetails(details: any) {
  if (!details) return null;
  
  // Handle array format (from callback)
  if (Array.isArray(details)) {
    for (const item of details) {
      if (!item || !item.Name) continue;
      
      const name = item.Name.toLowerCase().replace(/\s/g, '');
      if (name.includes('receipt') || name.includes('mpesareceipt')) {
        return item.Value?.toString() || null;
      }
    }
  }
  
  // Handle object format (from Firestore)
  if (typeof details === 'object' && !Array.isArray(details)) {
    if (details.MpesaReceiptNumber) return details.MpesaReceiptNumber;
    if (details.ReceiptNumber) return details.ReceiptNumber;
    if (details.receiptnumber) return details.receiptnumber;
    if (details.mpesareceiptnumber) return details.mpesareceiptnumber;
  }
  
  return null;
}
