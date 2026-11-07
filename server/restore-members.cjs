const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
require('dotenv').config();

const SEED_MEMBERS = [
  {
    id: 'm-1794032985989',
    groupId: 'grp-1',
    memberNo: 1,
    name: 'Ramu Korla',
    nameTe: 'రాము కొర్ల',
    phone: '8317573174',
    pin: '2244',
    role: 'member',
    hasLiftedChit: false,
    liftedMonth: null,
    totalPaidSoFar: 0,
    createdAt: new Date()
  },
  {
    id: 'm-1794033203078',
    groupId: 'grp-1',
    memberNo: 2,
    name: 'Uday Pedakota',
    nameTe: 'ఉదయ్ పెడకోట',
    phone: '9908660573',
    pin: '8329',
    role: 'member',
    hasLiftedChit: false,
    liftedMonth: null,
    totalPaidSoFar: 0,
    createdAt: new Date()
  },
  {
    id: 'm-1794033616085',
    groupId: 'grp-1',
    memberNo: 3,
    name: 'Saikumar K',
    nameTe: 'సాయికుమార్ K',
    phone: '9381660617',
    pin: '0617',
    role: 'member',
    hasLiftedChit: false,
    liftedMonth: null,
    totalPaidSoFar: 0,
    createdAt: new Date()
  },
  {
    id: 'm-1794042012651',
    groupId: 'grp-1',
    memberNo: 4,
    name: 'Nani M',
    nameTe: 'నాని M',
    phone: '7036349848',
    pin: '9848',
    role: 'member',
    hasLiftedChit: false,
    liftedMonth: null,
    totalPaidSoFar: 0,
    createdAt: new Date()
  },
  {
    id: 'm-1794043943702',
    groupId: 'grp-1',
    memberNo: 5,
    name: 'Phanidhar',
    nameTe: 'ఫణిధర్',
    phone: '8801147452',
    pin: '7452',
    role: 'member',
    hasLiftedChit: false,
    liftedMonth: null,
    totalPaidSoFar: 0,
    createdAt: new Date()
  },
  {
    id: 'm-1794045464207',
    groupId: 'grp-1',
    memberNo: 6,
    name: 'Deviprasad',
    nameTe: 'దేవిప్రసాద్',
    phone: '8897056497',
    pin: '6497',
    role: 'member',
    hasLiftedChit: false,
    liftedMonth: null,
    totalPaidSoFar: 0,
    createdAt: new Date()
  },
  {
    id: 'm-1794045799454',
    groupId: 'grp-1',
    memberNo: 7,
    name: 'Phanidher (Chit 2)',
    nameTe: 'ఫణిధర్ (చిట్ 2)',
    phone: '8801147452',
    pin: '7452',
    role: 'member',
    hasLiftedChit: false,
    liftedMonth: null,
    totalPaidSoFar: 0,
    createdAt: new Date()
  }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const Member = mongoose.model('Member', new mongoose.Schema({}, { strict: false }));

  for (const m of SEED_MEMBERS) {
    await Member.updateOne({ id: m.id }, { $set: m }, { upsert: true });
  }

  const all = await Member.find({});
  console.log('Total members in DB now:', all.length);
  console.log(all.map(m => `#${m.memberNo} ${m.name} (${m.phone}) - Paid: ${m.totalPaidSoFar}`));

  await mongoose.disconnect();
}

run().catch(console.error);

