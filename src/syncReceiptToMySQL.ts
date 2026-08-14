export interface ReceiptSyncData {
  driver_id?: string;
  vendor_name?: string;
  receipt_date?: string;
  transaction_date?: string;
  date?: string;
  receipt_time?: string;
  time?: string;
  total_amount?: number;
  amount?: number;
  tax_amount?: number;
  vat_amount?: number;
  category?: string;
  receipt_number?: string;
  invoice_number?: string;
  receiptId?: string;
  confidence?: number;
  image_url?: string;
}

/**
 * Saves a copy of extracted receipt data to a MySQL database via a PHP endpoint (/receipts.php).
 * This function is completely isolated and wrapped in its own try/catch block so failures or timeouts
 * will never block or delay the primary Firestore save flow.
 */
export async function syncReceiptToMySQL(data: ReceiptSyncData): Promise<void> {
  try {
    const endpoint = '/receipts.php';

    const payload = {
      driver_id: data.driver_id || '',
      vendor_name: data.vendor_name || '',
      receipt_date: data.receipt_date || data.transaction_date || data.date || new Date().toISOString().split('T')[0],
      receipt_time: data.receipt_time || data.time || new Date().toTimeString().split(' ')[0],
      total_amount: Number(data.total_amount ?? data.amount) || 0,
      tax_amount: Number(data.tax_amount ?? data.vat_amount) || 0,
      category: data.category || 'Fuel',
      receipt_number: data.receipt_number || data.invoice_number || data.receiptId || '',
      confidence: typeof data.confidence === 'number' ? data.confidence : 1.0,
      image_url: data.image_url || ''
    };

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('MySQL receipt sync failed:', error);
  }
}
