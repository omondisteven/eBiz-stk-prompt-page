type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

export function getReceiptFromDetails(details: any): string | null {
  if (!Array.isArray(details)) return null;

  // Normalize and search for common receipt name patterns
  const knownKeys = ['MpesaReceiptNumber', 'ReceiptNumber', 'TransactionReceipt'];

  for (const key of knownKeys) {
    const item = details.find((i: CallbackMetadataItem) =>
      i?.Name?.toLowerCase().replace(/\s/g, '') === key.toLowerCase().replace(/\s/g, '')
    );
    if (item?.Value) return item.Value.toString();
  }

  // Fallback: find anything that loosely matches "receipt" (case-insensitive)
  const fallback = details.find((i: CallbackMetadataItem) =>
    typeof i?.Name === 'string' && /receipt/i.test(i.Name)
  );

  return fallback?.Value?.toString() || null;
}
