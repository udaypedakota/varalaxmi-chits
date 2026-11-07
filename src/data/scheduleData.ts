import { ScheduleItem, ChitScheme, Member } from '../types/chit';

export const SCHEME_CONFIG: ChitScheme = {
  id: 'sv-chits-2026',
  name: 'Sri Varalaxmi Chits',
  nameTe: 'శ్రీ వరలక్ష్మి చిట్స్',
  totalValue: 200000,
  totalMonths: 20,
  totalMembers: 20,
  monthlyInstallment: 10000, // Month 1 Discounted Rate: ₹10,000 as per updated master chart
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

export const MONTH_SHORT_NAMES: { [key: number]: { en: string; te: string } } = {
  1: { en: "Dec '26", te: "డిసెం '26" },
  2: { en: "Jan '27", te: "జన '27" },
  3: { en: "Feb '27", te: "ఫిబ్ర '27" },
  4: { en: "Mar '27", te: "మార్చి '27" },
  5: { en: "Apr '27", te: "ఏప్రి '27" },
  6: { en: "May '27", te: "మే '27" },
  7: { en: "Jun '27", te: "జూన్ '27" },
  8: { en: "Jul '27", te: "జూలై '27" },
  9: { en: "Aug '27", te: "ఆగ '27" },
  10: { en: "Sep '27", te: "సెప్టెం '27" },
  11: { en: "Oct '27", te: "అక్టో '27" },
  12: { en: "Nov '27", te: "నవం '27" },
  13: { en: "Dec '27", te: "డిసెం '27" },
  14: { en: "Jan '28", te: "జన '28" },
  15: { en: "Feb '28", te: "ఫిబ్ర '28" },
  16: { en: "Mar '28", te: "మార్చి '28" },
  17: { en: "Apr '28", te: "ఏప్రి '28" },
  18: { en: "May '28", te: "మే '28" },
  19: { en: "Jun '28", te: "జూన్ '28" },
  20: { en: "Jul '28", te: "జూలై '28" }
};

// Updated Master 20-Month Schedule as per Sri Varalaxmi Chits Official Specifications Chart:
// Total Chit Value: ₹2,00,000 | 20 Months | 20 Members | Fixed Taken Rate: ₹11,500
// Column 1: Month (S.No) / నెల (నెం)
// Column 2: Chit Value / చిట్ విలువ (₹2,00,000)
// Column 3: Chit Not Taken (Discounted) / చిట్ తీసుకోని వారి వాయిదా (₹10,000 down to ₹0)
// Column 4: Chit Taken Rate (Fixed Post-Lift) / చిట్ తీసుకున్న వారి వాయిదా (₹11,500)
export const MASTER_SCHEDULE: ScheduleItem[] = [
  { month: 1,  chitValue: 200000, notTakenAmount: 10000, notTakenAmountTe: 10000, takenAmount: 11500 },
  { month: 2,  chitValue: 200000, notTakenAmount: 9950,  notTakenAmountTe: 9950,  takenAmount: 11500 },
  { month: 3,  chitValue: 200000, notTakenAmount: 9900,  notTakenAmountTe: 9900,  takenAmount: 11500 },
  { month: 4,  chitValue: 200000, notTakenAmount: 9850,  notTakenAmountTe: 9850,  takenAmount: 11500 },
  { month: 5,  chitValue: 200000, notTakenAmount: 9800,  notTakenAmountTe: 9800,  takenAmount: 11500 },
  { month: 6,  chitValue: 200000, notTakenAmount: 9600,  notTakenAmountTe: 9600,  takenAmount: 11500 },
  { month: 7,  chitValue: 200000, notTakenAmount: 9400,  notTakenAmountTe: 9400,  takenAmount: 11500 },
  { month: 8,  chitValue: 200000, notTakenAmount: 9150,  notTakenAmountTe: 9150,  takenAmount: 11500 },
  { month: 9,  chitValue: 200000, notTakenAmount: 8900,  notTakenAmountTe: 8900,  takenAmount: 11500 },
  { month: 10, chitValue: 200000, notTakenAmount: 8500,  notTakenAmountTe: 8500,  takenAmount: 11500 },
  { month: 11, chitValue: 200000, notTakenAmount: 8100,  notTakenAmountTe: 8110,  takenAmount: 11500 },
  { month: 12, chitValue: 200000, notTakenAmount: 7700,  notTakenAmountTe: 7660,  takenAmount: 11500 },
  { month: 13, chitValue: 200000, notTakenAmount: 7300,  notTakenAmountTe: 7210,  takenAmount: 11500 },
  { month: 14, chitValue: 200000, notTakenAmount: 6850,  notTakenAmountTe: 6760,  takenAmount: 11500 },
  { month: 15, chitValue: 200000, notTakenAmount: 6400,  notTakenAmountTe: 6310,  takenAmount: 11500 },
  { month: 16, chitValue: 200000, notTakenAmount: 5950,  notTakenAmountTe: 5860,  takenAmount: 11500 },
  { month: 17, chitValue: 200000, notTakenAmount: 5500,  notTakenAmountTe: 5410,  takenAmount: 11500 },
  { month: 18, chitValue: 200000, notTakenAmount: 5050,  notTakenAmountTe: 4960,  takenAmount: 11500 },
  { month: 19, chitValue: 200000, notTakenAmount: 4600,  notTakenAmountTe: 4510,  takenAmount: 11500 },
  { month: 20, chitValue: 200000, notTakenAmount: 0,     notTakenAmountTe: 0,     takenAmount: 11500 }
];

export function getScheduleNotTakenAmount(item: ScheduleItem, lang: 'te' | 'en' = 'en'): number {
  if (lang === 'te' && item.notTakenAmountTe !== undefined) {
    return item.notTakenAmountTe;
  }
  return item.notTakenAmount;
}

export function getInstallmentForMember(month: number, member: Member, lang: 'te' | 'en' = 'en'): number {
  if (member.hasLiftedChit && member.liftedMonth !== undefined && month > member.liftedMonth) {
    return SCHEME_CONFIG.fixedTakenInstallment; // ₹11,500
  }
  const item = MASTER_SCHEDULE.find(s => s.month === month);
  if (!item) return 0;
  return getScheduleNotTakenAmount(item, lang);
}
