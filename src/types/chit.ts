export interface ChitScheme {
  id: string;
  name: string;
  nameTe: string;
  totalValue: number; // ₹2,00,000
  totalMonths: number; // 20
  totalMembers: number; // 20
  fixedTakenInstallment: number; // ₹11,500
  currentMonth: number; // 1 - 20
  paymentDueDay: number; // 10th
  organizerName: string;
  organizerPhone: string;
  organizerUpiId: string;
}

export interface ScheduleItem {
  month: number;
  chitValue: number; // ₹2,00,000
  notTakenAmount: number; // e.g. 10900 down to 0
  takenAmount: number; // ₹11,500
}

export interface Member {
  id: string;
  memberNo: number; // 1 - 20
  name: string;
  nameTe: string;
  phone: string;
  pin: string;
  role: 'member' | 'organizer';
  hasLiftedChit: boolean;
  liftedMonth?: number;
  totalPaidSoFar: number;
}

export interface PaymentRecord {
  id: string;
  memberId: string;
  memberName: string;
  month: number;
  amount: number;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
  utr?: string;
  paymentMode: 'UPI' | 'Cash' | 'Bank Transfer';
  receiptNo: string;
}

export interface LotteryRecord {
  id: string;
  month: number;
  winnerMemberId: string;
  winnerName: string;
  winnerNameTe: string;
  drawnAt: string;
  eligibleMemberCount: number;
}
