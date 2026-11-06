import { ChitGroup } from '../types/chit';

// Both Chits are strictly ₹2,00,000 Schemes (20 Months • 20 Members • ₹10,000 Month 1)
export const DEFAULT_GROUPS: ChitGroup[] = [
  {
    id: 'grp-1',
    name: 'Sri Varalaxmi Chits (Group A)',
    nameTe: 'శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ A)',
    totalValue: 200000,
    totalMonths: 20,
    totalMembers: 20,
    monthlyInstallment: 10000,
    fixedTakenInstallment: 11500,
    commissionPercent: 5,
    currentMonth: 1, // Start at Month 1
    paymentDueDay: 10,
    organizerName: 'Siva (Organizer)',
    organizerPhone: '8790859546',
    organizerUpiId: '8790859546@ybl',
    status: 'active'
  },
  {
    id: 'grp-2',
    name: 'Sri Varalaxmi Chits (Group B)',
    nameTe: 'శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ B)',
    totalValue: 200000,
    totalMonths: 20,
    totalMembers: 20,
    monthlyInstallment: 10000,
    fixedTakenInstallment: 11500,
    commissionPercent: 5,
    currentMonth: 1, // Start at Month 1
    paymentDueDay: 10,
    organizerName: 'Siva (Organizer)',
    organizerPhone: '8790859546',
    organizerUpiId: '8790859546@ybl',
    status: 'active'
  }
];
