import { ScheduleItem, ChitScheme, Member } from '../types/chit';

export const SCHEME_CONFIG: ChitScheme = {
  id: 'sv-chits-2026',
  name: 'Sri Varalaxmi Chits',
  nameTe: 'శ్రీ వరలక్ష్మి చిట్స్',
  totalValue: 200000,
  totalMonths: 20,
  totalMembers: 20,
  monthlyInstallment: 11350, // Month 1 Less Price: ₹11,350
  fixedTakenInstallment: 11500, // Fixed Rate after lifting: ₹11,500
  commissionPercent: 5,
  currentMonth: 1, // Fresh start at Month 1
  paymentDueDay: 10,
  organizerName: 'Siva (Organizer)',
  organizerPhone: '8790859546',
  organizerUpiId: '8790859546@ybl',
  status: 'active'
};

// Exact 20-Month Schedule from Sri Varalaxmi Chits Master Chart
// Starts December 2026 (నెల 1: డిసెంబర్ 2026, నెల 2: జనవరి 2027...)
export const MONTH_CALENDAR_NAMES: { [key: number]: { en: string; te: string } } = {
  1: { en: 'December 2026', te: 'డిసెంబర్ 2026' },
  2: { en: 'January 2027', te: 'జనవరి 2027' },
  3: { en: 'February 2027', te: 'ఫిబ్రవరి 2027' },
  4: { en: 'March 2027', te: 'మార్చి 2027' },
  5: { en: 'April 2027', te: 'ఏప్రిల్ 2027' },
  6: { en: 'May 2027', te: 'మే 2027' },
  7: { en: 'June 2027', te: 'జూన్ 2027' },
  8: { en: 'July 2027', te: 'జూలై 2027' },
  9: { en: 'August 2027', te: 'ఆగస్టు 2027' },
  10: { en: 'September 2027', te: 'సెప్టెంబర్ 2027' },
  11: { en: 'October 2027', te: 'అక్టోబర్ 2027' },
  12: { en: 'November 2027', te: 'నవంబర్ 2027' },
  13: { en: 'December 2027', te: 'డిసెంబర్ 2027' },
  14: { en: 'January 2028', te: 'జనవరి 2028' },
  15: { en: 'February 2028', te: 'ఫిబ్రవరి 2028' },
  16: { en: 'March 2028', te: 'మార్చి 2028' },
  17: { en: 'April 2028', te: 'ఏప్రిల్ 2028' },
  18: { en: 'May 2028', te: 'మే 2028' },
  19: { en: 'June 2028', te: 'జూన్ 2028' },
  20: { en: 'July 2028', te: 'జూలై 2028' }
};

export function getMonthDisplayName(month: number, lang: 'te' | 'en' = 'te'): string {
  const meta = MONTH_CALENDAR_NAMES[month];
  if (!meta) return lang === 'te' ? `నెల ${month}` : `Month ${month}`;
  return lang === 'te' ? `నెల ${month} (${meta.te})` : `Month ${month} (${meta.en})`;
}

// Strictly 4 Columns as per Sri Varalaxmi Chits Official 20-Month Mutual Benefit Chit Fund Scheme poster:
// 1. Month (S.No) / నెల (నెం)
// 2. Chit Value / చిట్ విలువ (₹2,00,000 for all 20 months)
// 3. Chit Not Taken (Less Price) / చిట్ తీసుకోని వారి వాయిదా (₹11,350 down to ₹0)
// 4. Chit Taken (Fixed Rate) / చిట్ తీసుకున్న వారి స్థిర వాయిదా (₹11,500 for all 20 months)
export const MASTER_SCHEDULE: ScheduleItem[] = [
  { month: 1,  chitValue: 200000, notTakenAmount: 11350, takenAmount: 11500 },
  { month: 2,  chitValue: 200000, notTakenAmount: 10950, takenAmount: 11500 },
  { month: 3,  chitValue: 200000, notTakenAmount: 10550, takenAmount: 11500 },
  { month: 4,  chitValue: 200000, notTakenAmount: 10150, takenAmount: 11500 },
  { month: 5,  chitValue: 200000, notTakenAmount: 9750,  takenAmount: 11500 },
  { month: 6,  chitValue: 200000, notTakenAmount: 9350,  takenAmount: 11500 },
  { month: 7,  chitValue: 200000, notTakenAmount: 8950,  takenAmount: 11500 },
  { month: 8,  chitValue: 200000, notTakenAmount: 8550,  takenAmount: 11500 },
  { month: 9,  chitValue: 200000, notTakenAmount: 8150,  takenAmount: 11500 },
  { month: 10, chitValue: 200000, notTakenAmount: 7800,  takenAmount: 11500 },
  { month: 11, chitValue: 200000, notTakenAmount: 7400,  takenAmount: 11500 },
  { month: 12, chitValue: 200000, notTakenAmount: 7000,  takenAmount: 11500 },
  { month: 13, chitValue: 200000, notTakenAmount: 6600,  takenAmount: 11500 },
  { month: 14, chitValue: 200000, notTakenAmount: 6200,  takenAmount: 11500 },
  { month: 15, chitValue: 200000, notTakenAmount: 5850,  takenAmount: 11500 },
  { month: 16, chitValue: 200000, notTakenAmount: 5500,  takenAmount: 11500 },
  { month: 17, chitValue: 200000, notTakenAmount: 5150,  takenAmount: 11500 },
  { month: 18, chitValue: 200000, notTakenAmount: 4800,  takenAmount: 11500 },
  { month: 19, chitValue: 200000, notTakenAmount: 4450,  takenAmount: 11500 },
  { month: 20, chitValue: 200000, notTakenAmount: 0,     takenAmount: 11500 }
];

export function getInstallmentForMember(month: number, member: Member): number {
  if (member.hasLiftedChit && member.liftedMonth !== undefined && month > member.liftedMonth) {
    return SCHEME_CONFIG.fixedTakenInstallment; // ₹11,500
  }
  const item = MASTER_SCHEDULE.find(s => s.month === month);
  return item ? item.notTakenAmount : 0;
}
