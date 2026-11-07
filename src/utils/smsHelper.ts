/**
 * SMS & Messaging Utility for Sri Varalaxmi Chits
 * Generates clean English SMS templates and triggers native device SMS / WhatsApp.
 */

export interface EnrollmentSmsParams {
  memberName: string;
  phone: string;
  pin: string;
  groupName?: string;
  organizerName?: string;
  organizerPhone?: string;
  appUrl?: string;
}

export interface PaymentReceiptSmsParams {
  memberName: string;
  month: number;
  amount: number;
  receiptNo?: string;
  organizerName?: string;
  organizerPhone?: string;
}

/**
 * 1. New Member Enrollment SMS (English)
 */
export const getEnrollmentSmsText = (params: EnrollmentSmsParams): string => {
  const org = params.organizerName || 'Siva';
  const orgPhone = params.organizerPhone || '8790859546';
  const group = params.groupName || 'Group A';
  const url = params.appUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://varalaxmi-chits.vercel.app');

  return (
    `Sri Varalaxmi Chits:\n` +
    `Hello ${params.memberName}, welcome to Sri Varalaxmi Chits (${group})!\n\n` +
    `Your Login Credentials:\n` +
    `Mobile: ${params.phone}\n` +
    `Security PIN: ${params.pin}\n` +
    `Login URL: ${url}\n\n` +
    `- Organizer: ${org} (${orgPhone})`
  );
};

/**
 * 2. Payment Received / Approved SMS Receipt (English)
 */
export const getPaymentReceiptSmsText = (params: PaymentReceiptSmsParams): string => {
  const org = params.organizerName || 'Siva';
  const orgPhone = params.organizerPhone || '8790859546';
  const receipt = params.receiptNo || 'RC-101';
  const formattedAmount = params.amount.toLocaleString('en-IN');

  return (
    `Sri Varalaxmi Chits:\n` +
    `Hello ${params.memberName}, your Month ${params.month} installment of Rs ${formattedAmount} has been received successfully.\n` +
    `Receipt No: ${receipt}\n` +
    `Total Paid: Rs ${formattedAmount}\n` +
    `Thank you for participating in Sri Varalaxmi Chits!\n\n` +
    `- Organizer: ${org} (${orgPhone})`
  );
};

/**
 * Opens native device SMS app with pre-filled recipient and English message.
 * Compatible with both iOS (using '&body=') and Android (using '?body=').
 */
export const openDeviceSms = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : cleanPhone;
  
  // Guarantee copy to clipboard so message is never lost even if SMS app fails
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      navigator.clipboard.writeText(message);
    } catch {}
  }

  // Modern iOS (iOS 9+) and Android both use '?body=' to pre-fill recipient + message body
  const smsUrl = `sms:${formattedPhone}?body=${encodeURIComponent(message)}`;
  
  // Directly trigger SMS protocol handler
  window.location.href = smsUrl;
};

/**
 * Opens WhatsApp with pre-filled recipient and message.
 */
export const openWhatsApp = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
};

