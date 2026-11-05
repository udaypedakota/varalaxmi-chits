import { ScheduleItem, ChitScheme, Member } from '../types/chit';

export const SCHEME_CONFIG: ChitScheme = {
  id: 'sv-chits-2026',
  name: 'Sri Varalaxmi Chits',
  nameTe: 'శ్రీ వరలక్ష్మి చిట్స్',
  totalValue: 200000,
  totalMonths: 20,
  totalMembers: 20,
  fixedTakenInstallment: 11500,
  currentMonth: 3, // Defaults to Month 3 (configurable)
  paymentDueDay: 10,
  organizerName: 'Phani (Organizer)',
  organizerPhone: '8801147452',
  organizerUpiId: '8801147452@ybl'
};

// Exact 20-Month Schedule from Sri Varalaxmi Chits Master Chart
// Strictly 4 Columns as requested:
// 1. నెల (Month)
// 2. చిట్ విలువ (Chit Value ₹2,00,000)
// 3. చిట్ తీసుకోని వారి వాయిదా (Less Price: ₹10,900 to ₹0)
// 4. చిట్ తీసుకున్న వారి స్థిర వాయిదా (Fixed Rate: ₹11,500)
export const MASTER_SCHEDULE: ScheduleItem[] = [
  { month: 1,  chitValue: 200000, notTakenAmount: 10900, takenAmount: 11500 },
  { month: 2,  chitValue: 200000, notTakenAmount: 10650, takenAmount: 11500 },
  { month: 3,  chitValue: 200000, notTakenAmount: 10350, takenAmount: 11500 },
  { month: 4,  chitValue: 200000, notTakenAmount: 10100, takenAmount: 11500 },
  { month: 5,  chitValue: 200000, notTakenAmount: 9800,  takenAmount: 11500 },
  { month: 6,  chitValue: 200000, notTakenAmount: 9450,  takenAmount: 11500 },
  { month: 7,  chitValue: 200000, notTakenAmount: 9150,  takenAmount: 11500 },
  { month: 8,  chitValue: 200000, notTakenAmount: 8800,  takenAmount: 11500 },
  { month: 9,  chitValue: 200000, notTakenAmount: 8400,  takenAmount: 11500 },
  { month: 10, chitValue: 200000, notTakenAmount: 8050,  takenAmount: 11500 },
  { month: 11, chitValue: 200000, notTakenAmount: 7650,  takenAmount: 11500 },
  { month: 12, chitValue: 200000, notTakenAmount: 7250,  takenAmount: 11500 },
  { month: 13, chitValue: 200000, notTakenAmount: 6800,  takenAmount: 11500 },
  { month: 14, chitValue: 200000, notTakenAmount: 6350,  takenAmount: 11500 },
  { month: 15, chitValue: 200000, notTakenAmount: 5950,  takenAmount: 11500 },
  { month: 16, chitValue: 200000, notTakenAmount: 5450,  takenAmount: 11500 },
  { month: 17, chitValue: 200000, notTakenAmount: 4950,  takenAmount: 11500 },
  { month: 18, chitValue: 200000, notTakenAmount: 4500,  takenAmount: 11500 },
  { month: 19, chitValue: 200000, notTakenAmount: 3950,  takenAmount: 11500 },
  { month: 20, chitValue: 200000, notTakenAmount: 0,     takenAmount: 11500 }
];

export function getInstallmentForMember(month: number, member: Member): number {
  if (member.hasLiftedChit && member.liftedMonth !== undefined && month > member.liftedMonth) {
    return SCHEME_CONFIG.fixedTakenInstallment; // ₹11,500
  }
  const item = MASTER_SCHEDULE.find(s => s.month === month);
  return item ? item.notTakenAmount : 0;
}
