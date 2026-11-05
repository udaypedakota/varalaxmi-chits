import { Member } from '../types/chit';

export const DEFAULT_MEMBERS: Member[] = [
  {
    id: 'm-01',
    memberNo: 1,
    name: 'Phani (Organizer)',
    nameTe: 'ఫణి (ఆర్గనైజర్)',
    phone: '8801147452',
    pin: '1234',
    role: 'organizer',
    hasLiftedChit: true,
    liftedMonth: 1, // Lifted in Month 1
    totalPaidSoFar: 33900 // Month 1: 10900 + Month 2: 11500 + Month 3: 11500
  },
  {
    id: 'm-02',
    memberNo: 2,
    name: 'Uday (Member)',
    nameTe: 'ఉదయ్',
    phone: '9908660573',
    pin: '1234',
    role: 'member',
    hasLiftedChit: true,
    liftedMonth: 2, // Lifted in Month 2
    totalPaidSoFar: 33050 // Month 1: 10900 + Month 2: 10650 + Month 3: 11500
  },
  {
    id: 'm-03',
    memberNo: 3,
    name: 'Suresh Kumar',
    nameTe: 'సురేష్ కుమార్',
    phone: '9848012345',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900 // Month 1: 10900 + Month 2: 10650 + Month 3: 10350
  },
  {
    id: 'm-04',
    memberNo: 4,
    name: 'Ramesh Naidu',
    nameTe: 'రమేష్ నాయుడు',
    phone: '9440123456',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 21550 // Month 1: 10900 + Month 2: 10650 (Month 3 pending)
  },
  {
    id: 'm-05',
    memberNo: 5,
    name: 'Venkat Rao',
    nameTe: 'వెంకట్ రావు',
    phone: '9849112233',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-06',
    memberNo: 6,
    name: 'Srinivasulu',
    nameTe: 'శ్రీనివాసులు',
    phone: '9701234567',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-07',
    memberNo: 7,
    name: 'Rajesh Varma',
    nameTe: 'రాజేష్ వర్మ',
    phone: '9989012345',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-08',
    memberNo: 8,
    name: 'Prasad Reddy',
    nameTe: 'ప్రసాద్ రెడ్డి',
    phone: '9490123456',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-09',
    memberNo: 9,
    name: 'Shiva Shankar',
    nameTe: 'శివ శంకర్',
    phone: '9866123456',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 21550
  },
  {
    id: 'm-10',
    memberNo: 10,
    name: 'Krishna Murthy',
    nameTe: 'కృష్ణమూర్తి',
    phone: '9848554433',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-11',
    memberNo: 11,
    name: 'Satish Babu',
    nameTe: 'సతీష్ బాబు',
    phone: '9000123456',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-12',
    memberNo: 12,
    name: 'Ravi Teja',
    nameTe: 'రవితేజ',
    phone: '9123456780',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-13',
    memberNo: 13,
    name: 'Vamsi Krishna',
    nameTe: 'వంశీ కృష్ణ',
    phone: '9676123456',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-14',
    memberNo: 14,
    name: 'Naresh Goud',
    nameTe: 'నరేష్ గౌడ్',
    phone: '9550123456',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-15',
    memberNo: 15,
    name: 'Balaji Srinivas',
    nameTe: 'బాలాజీ శ్రీనివాస్',
    phone: '9885123456',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-16',
    memberNo: 16,
    name: 'Vijay Kumar',
    nameTe: 'విజయ్ కుమార్',
    phone: '9704123456',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-17',
    memberNo: 17,
    name: 'Anand Paul',
    nameTe: 'ఆనంద్ పాల్',
    phone: '9949123456',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-18',
    memberNo: 18,
    name: 'Mohan Das',
    nameTe: 'మోహన్ దాస్',
    phone: '9849223344',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-19',
    memberNo: 19,
    name: 'Sai Kumar',
    nameTe: 'సాయి కుమార్',
    phone: '9391123456',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  },
  {
    id: 'm-20',
    memberNo: 20,
    name: 'Mahesh Babu',
    nameTe: 'మహేష్ బాబు',
    phone: '9848998877',
    pin: '1234',
    role: 'member',
    hasLiftedChit: false,
    totalPaidSoFar: 31900
  }
];
