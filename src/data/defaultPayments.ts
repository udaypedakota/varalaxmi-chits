import { PaymentRecord, LotteryRecord } from '../types/chit';

export const DEFAULT_PAYMENTS: PaymentRecord[] = [
  // Month 3 Samples
  {
    id: 'pay-301',
    memberId: 'm-01',
    memberName: 'Phani (Organizer)',
    month: 3,
    amount: 11500,
    date: '2026-03-02',
    status: 'approved',
    utr: 'UTR880114745201',
    paymentMode: 'UPI',
    receiptNo: 'SVC-2026-03-001'
  },
  {
    id: 'pay-302',
    memberId: 'm-02',
    memberName: 'Uday',
    month: 3,
    amount: 11500,
    date: '2026-03-03',
    status: 'approved',
    utr: 'UTR990866057302',
    paymentMode: 'UPI',
    receiptNo: 'SVC-2026-03-002'
  },
  {
    id: 'pay-303',
    memberId: 'm-03',
    memberName: 'Suresh Kumar',
    month: 3,
    amount: 10350,
    date: '2026-03-04',
    status: 'approved',
    utr: 'UTR984801234503',
    paymentMode: 'UPI',
    receiptNo: 'SVC-2026-03-003'
  },
  {
    id: 'pay-304',
    memberId: 'm-04',
    memberName: 'Ramesh Naidu',
    month: 3,
    amount: 10350,
    date: '2026-03-05',
    status: 'pending',
    utr: 'UPI/9440123456/PAY',
    paymentMode: 'UPI',
    receiptNo: 'SVC-2026-03-004'
  }
];

export const DEFAULT_LOTTERY_HISTORY: LotteryRecord[] = [
  {
    id: 'lot-01',
    month: 1,
    winnerMemberId: 'm-01',
    winnerName: 'Phani (Organizer)',
    winnerNameTe: 'ఫణి (ఆర్గనైజర్)',
    drawnAt: '2026-01-10T18:30:00Z',
    eligibleMemberCount: 20
  },
  {
    id: 'lot-02',
    month: 2,
    winnerMemberId: 'm-02',
    winnerName: 'Uday',
    winnerNameTe: 'ఉదయ్',
    drawnAt: '2026-02-10T19:00:00Z',
    eligibleMemberCount: 19
  }
];
