export interface ChitGroup {
  id: string;
  name: string;
  nameTe: string;
  totalValue: number; // e.g. ₹2,00,000
  totalMonths: number; // e.g. 20
  totalMembers: number; // e.g. 20
  monthlyInstallment: number;
  fixedTakenInstallment: number; // ₹11,500
  commissionPercent: number; // e.g. 5%
  currentMonth: number; // 1 - 20
  paymentDueDay: number; // 10th
  organizerName: string;
  organizerPhone: string;
  organizerUpiId: string;
  status: 'active' | 'completed';
}

export type ChitScheme = ChitGroup;

export interface ScheduleItem {
  month: number;
  chitValue: number;
  notTakenAmount: number;
  takenAmount: number;
}

export interface Member {
  id: string;
  groupId?: string;
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
  groupId?: string;
  memberId: string;
  memberName: string;
  month: number;
  amount: number;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
  utr?: string;
  proofUrl?: string; // Uploaded payment receipt screenshot (base64)
  paymentMode: 'UPI' | 'Cash' | 'Bank Transfer' | 'PhonePe' | string;
  receiptNo: string;
}

export interface LotteryRecord {
  id: string;
  groupId?: string;
  month: number;
  winnerMemberId: string;
  winnerName: string;
  winnerNameTe: string;
  drawnAt: string;
  eligibleMemberCount: number;
  auditRef?: string;
  excludedMembers?: { id: string; name: string; reason: string }[];
}

export interface ChitNotification {
  id: string;
  title: string;
  titleTe: string;
  message: string;
  messageTe: string;
  type: 'due' | 'payment' | 'lottery' | 'general';
  date: string;
  isRead: boolean;
  memberId?: string;
  groupId?: string;
}

export interface ChitLiftingRecord {
  id: string;
  groupId: string;
  month: number;
  memberId: string;
  memberName: string;
  memberNameTe: string;
  memberNo?: number;
  liftType: 'auction' | 'lottery'; // వేలం పాట (Auction) లేదా లక్కీ డ్రా (Lottery)
  chitValue: number; // e.g. 200000
  bidDiscount: number; // వేలం పాట తగ్గింపు (e.g. 20000)
  organizerCommission: number; // e.g. 10000 (5%)
  netDistributedAmount: number; // చేతికి అందిన మొత్తం (e.g. 180000)
  dividendPerMember?: number; // మిగిలిన సభ్యులకు తగ్గింపు
  date: string;
  status: 'distributed' | 'pending';
  notes?: string;
  createdAt?: string;
}

export interface CommissionRecord {
  month: number;
  totalPool: number;
  commissionPercent: number;
  commissionAmount: number;
  collectedAmount: number;
  status: 'received' | 'pending';
}
