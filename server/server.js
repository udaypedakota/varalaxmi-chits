import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import webpush from 'web-push';

// Web Push Notification Setup (VAPID)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BHDCaC5ncvVC_rr8XwAL9YTG8oc79YXlAVPpOfyDWhAaFoxLSeVZZphYR6SiK5BEJl89dC_xwUIz2nASBzJo8zI';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '3oLx8MAPj2fkLhE-GupsPeSvQqE7SjSfTDY2YfhJpjg';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ysivakumar@intellectinfo.com';

try {
  webpush.setVapidDetails(
    `mailto:${ADMIN_EMAIL}`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
  console.log('[WebPush] VAPID configured successfully');
} catch (err) {
  console.error('[WebPush] VAPID config error:', err.message);
}

// Fix Node.js Windows SRV lookup failure with Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  console.log('DNS setting note:', e.message);
}

// Process Level Safety Guards
process.on('uncaughtException', (err) => {
  console.error('Unhandled Server Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Mongoose Schemas & Models
import mongoosePkg from 'mongoose';
const { Schema, model } = mongoosePkg;

const GroupSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nameTe: { type: String, required: true },
  totalValue: { type: Number, required: true }, // e.g. 200000
  totalMonths: { type: Number, required: true }, // e.g. 20
  totalMembers: { type: Number, required: true }, // e.g. 20
  monthlyInstallment: { type: Number, required: true },
  fixedTakenInstallment: { type: Number, default: 11500 },
  commissionPercent: { type: Number, default: 5 }, // 5%
  currentMonth: { type: Number, default: 3 },
  paymentDueDay: { type: Number, default: 10 },
  organizerName: { type: String, default: 'Siva (Organizer)' },
  organizerPhone: { type: String, default: '8790859546' },
  organizerUpiId: { type: String, default: '8790859546@ybl' },
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const MemberSchema = new Schema({
  id: { type: String, required: true, unique: true },
  groupId: { type: String, required: true },
  memberNo: { type: Number, required: true },
  name: { type: String, required: true },
  nameTe: { type: String, required: true },
  phone: { type: String, required: true },
  pin: { type: String, default: '1234' },
  role: { type: String, enum: ['member', 'organizer'], default: 'member' },
  hasLiftedChit: { type: Boolean, default: false },
  liftedMonth: { type: Number },
  totalPaidSoFar: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const PaymentSchema = new Schema({
  id: { type: String, required: true, unique: true },
  groupId: { type: String, required: true },
  memberId: { type: String, required: true },
  memberName: { type: String, required: true },
  month: { type: Number, required: true },
  amount: { type: Number, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending' },
  utr: { type: String },
  proofUrl: { type: String }, // Base64 screenshot or image URL
  paymentMode: { type: String, default: 'UPI' },
  receiptNo: { type: String, required: true },
  approvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

const LotterySchema = new Schema({
  id: { type: String, required: true, unique: true },
  groupId: { type: String, required: true },
  month: { type: Number, required: true },
  winnerMemberId: { type: String, required: true },
  winnerName: { type: String, required: true },
  winnerNameTe: { type: String, required: true },
  drawnAt: { type: String, required: true },
  eligibleMemberCount: { type: Number, required: true },
  auditRef: { type: String, required: true },
  excludedMembers: [{ id: String, name: String, reason: String }],
  createdAt: { type: Date, default: Date.now }
});

const AuditLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  groupId: { type: String, required: true },
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  details: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

// Monthly Chit Lifting & Auction Schema (పాట పాడుకున్నవారు / వేలం పాట & విజేత)
const LiftingSchema = new Schema({
  id: { type: String, required: true, unique: true },
  groupId: { type: String, required: true },
  month: { type: Number, required: true },
  memberId: { type: String, required: true },
  memberName: { type: String, required: true },
  memberNameTe: { type: String, required: true },
  memberNo: { type: Number },
  liftType: { type: String, enum: ['auction', 'lottery'], default: 'auction' }, // 'auction' (వేలం పాట) or 'lottery' (లక్కీ డ్రా)
  chitValue: { type: Number, default: 200000 },
  bidDiscount: { type: Number, default: 0 }, // వేలం పాట తగ్గింపు
  organizerCommission: { type: Number, default: 10000 }, // 5% = ₹10,000
  netDistributedAmount: { type: Number, required: true }, // చేతికి అందిన నికర మొత్తం
  dividendPerMember: { type: Number, default: 0 }, // మిగిలిన సభ్యులకు తగ్గింపు
  date: { type: String, required: true },
  status: { type: String, default: 'distributed' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const GroupModel = model('Group', GroupSchema);
const MemberModel = model('Member', MemberSchema);
const PaymentModel = model('Payment', PaymentSchema);
const LotteryModel = model('Lottery', LotterySchema);
const AuditLogModel = model('AuditLog', AuditLogSchema);
const LiftingModel = model('Lifting', LiftingSchema);

const NotificationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  groupId: { type: String, required: true },
  title: { type: String, required: true },
  titleTe: { type: String },
  message: { type: String, required: true },
  messageTe: { type: String },
  type: { type: String, default: 'system' },
  date: { type: String, required: true },
  targetRole: { type: String, default: 'all' },
  targetMemberId: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const NotificationModel = model('Notification', NotificationSchema);

const SubscriptionSchema = new Schema({
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: String,
    auth: String
  },
  memberId: String,
  phone: String,
  role: String,
  subscribedAt: { type: Date, default: Date.now }
});
const SubscriptionModel = model('Subscription', SubscriptionSchema);

// Initial Seed Data Templates (Clean Slate Month 1 - Both 2L Schemes)
const INITIAL_GROUPS = [
  {
    id: 'grp-1',
    name: 'Sri Varalaxmi Chits (Group A)',
    nameTe: 'శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ A)',
    totalValue: 200000,
    totalMonths: 20,
    totalMembers: 20,
    monthlyInstallment: 11350,
    fixedTakenInstallment: 11500,
    commissionPercent: 5,
    currentMonth: 1, // Fresh Start: Month 1
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
    monthlyInstallment: 11350,
    fixedTakenInstallment: 11500,
    commissionPercent: 5,
    currentMonth: 1, // Fresh Start: Month 1
    paymentDueDay: 10,
    organizerName: 'Siva (Organizer)',
    organizerPhone: '8790859546',
    organizerUpiId: '8790859546@ybl',
    status: 'active'
  }
];

// Organizer Siva is NEVER in the member database. Members collection strictly holds the 20 participants!
const INITIAL_MEMBERS = [];

// Clean Slate: No initial dummy payments
const INITIAL_PAYMENTS = [];

// Clean Slate: No initial dummy lottery winners
const INITIAL_LOTTERY = [];

// Clean Slate: No initial dummy liftings/auctions
const INITIAL_LIFTINGS = [];

// In-Memory Fallback Store (active if MongoDB Atlas is connecting or offline)
let memoryStore = {
  groups: [...INITIAL_GROUPS],
  members: [...INITIAL_MEMBERS],
  payments: [...INITIAL_PAYMENTS],
  lottery: [...INITIAL_LOTTERY],
  liftings: [...INITIAL_LIFTINGS],
  notifications: [],
  subscriptions: [],
  audit: []
};

let isMongoConnected = false;

// Connect to MongoDB Atlas
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes('<username>')) {
    console.log('⚠️ MongoDB Atlas URI not configured or placeholder detected. Running with In-Memory fallback.');
    return;
  }

  try {
    mongoosePkg.set('strictQuery', false);
    await mongoosePkg.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    isMongoConnected = true;
    console.log('✅ Successfully connected to MongoDB Atlas Cloud Database!');
    
    // Auto-normalize Group details and update Organizer Siva phone number to 8790859546
    await GroupModel.updateMany(
      {},
      { 
        $set: { 
          organizerPhone: '8790859546',
          organizerUpiId: '8790859546@ybl',
          totalValue: 200000,
          totalMonths: 20,
          totalMembers: 20,
          monthlyInstallment: 11350,
          fixedTakenInstallment: 11500
        } 
      }
    );
    await GroupModel.updateOne(
      { id: 'grp-2' },
      { 
        $set: { 
          name: 'Sri Varalaxmi Chits (Group B)',
          nameTe: 'శ్రీ వరలక్ష్మి చిట్స్ (గ్రూప్ B)',
          totalValue: 200000, 
          totalMonths: 20, 
          totalMembers: 20, 
          monthlyInstallment: 11350 
        } 
      }
    );
    // Purge organizer from members collection if present
    await MemberModel.deleteMany({ $or: [{ role: 'organizer' }, { phone: '8801147452' }, { phone: '8790859546' }] });

    // Check if empty, if so, seed automatically with clean slate Month 1
    const groupCount = await GroupModel.countDocuments();
    if (groupCount === 0) {
      console.log('🌱 Seeding clean slate Month 1 data to MongoDB Atlas...');
      await seedDatabase();
    }
  } catch (err) {
    console.error('⚠️ MongoDB Atlas connection error:', err.message);
    console.log('Running in Hybrid In-Memory Fallback mode.');
  }
}

async function seedDatabase() {
  if (isMongoConnected) {
    await GroupModel.deleteMany({});
    await MemberModel.deleteMany({});
    await PaymentModel.deleteMany({});
    await LotteryModel.deleteMany({});
    await LiftingModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await AuditLogModel.deleteMany({});

    await GroupModel.insertMany(INITIAL_GROUPS);
    await MemberModel.insertMany(INITIAL_MEMBERS);
    // 0 payments, 0 lotteries, 0 liftings in clean slate
  } else {
    memoryStore = {
      groups: JSON.parse(JSON.stringify(INITIAL_GROUPS)),
      members: JSON.parse(JSON.stringify(INITIAL_MEMBERS)),
      payments: [],
      lottery: [],
      liftings: [],
      notifications: [],
      audit: []
    };
  }
}

async function truncateDatabase() {
  if (isMongoConnected) {
    // Clear all transaction records (payments, lotteries, liftings, audit logs)
    await PaymentModel.deleteMany({});
    await LotteryModel.deleteMany({});
    await LiftingModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await AuditLogModel.deleteMany({});
    // Reset all members to Month 1 clean slate (0 paid, 0 lifted)
    await MemberModel.updateMany({}, { hasLiftedChit: false, liftedMonth: null, totalPaidSoFar: 0 });
    // Reset groups to Month 1
    await GroupModel.updateMany({}, { currentMonth: 1 });
  } else {
    memoryStore.payments = [];
    memoryStore.lottery = [];
    memoryStore.liftings = [];
    memoryStore.audit = [];
    memoryStore.members.forEach(m => {
      m.hasLiftedChit = false;
      m.liftedMonth = null;
      m.totalPaidSoFar = 0;
    });
    memoryStore.groups.forEach(g => {
      g.currentMonth = 1;
    });
  }
}

// Helper function to send Real Web Push Notifications to Phone Lock Screen
async function sendPushNotification(query, payload) {
  try {
    let subs = [];
    if (isMongoConnected) {
      subs = await SubscriptionModel.find(query || {}).lean();
    } else {
      subs = (memoryStore.subscriptions || []).filter(s => {
        if (!query || Object.keys(query).length === 0) return true;
        for (const k in query) {
          if (s[k] !== query[k]) return false;
        }
        return true;
      });
    }

    if (!subs || subs.length === 0) {
      console.log('[WebPush] No matching push subscriptions for:', JSON.stringify(query || {}));
      return { sent: 0, total: 0 };
    }

    const seenEndpoints = new Set();
    const pushOptions = {
      TTL: 86400,
      urgency: 'high',
      headers: { 'Urgency': 'high' }
    };
    let sentCount = 0;
    for (const subRecord of subs) {
      const sub = subRecord.subscription || subRecord;
      if (!sub || !sub.endpoint || seenEndpoints.has(sub.endpoint)) continue;
      seenEndpoints.add(sub.endpoint);

      const playerPayloadStr = JSON.stringify({
        title: payload.title || 'శ్రీ వరలక్ష్మి చిట్స్',
        body: payload.body || '',
        icon: '/chit-app-icon-192.png',
        badge: '/chit-app-icon-192.png',
        tag: payload.tag || 'chit-alert-' + Date.now(),
        url: payload.url || '/'
      });

      try {
        await webpush.sendNotification(sub, playerPayloadStr, pushOptions);
        sentCount++;
      } catch (err) {
        console.error('[WebPush] Delivery error:', sub.endpoint?.slice(0, 30), err.statusCode || err.message);
        if (err.statusCode === 404 || err.statusCode === 410) {
          if (isMongoConnected) {
            await SubscriptionModel.deleteOne({ endpoint: sub.endpoint }).catch(() => {});
          } else {
            memoryStore.subscriptions = (memoryStore.subscriptions || []).filter(s => s.endpoint !== sub.endpoint);
          }
        }
      }
    }
    console.log(`[WebPush] Successfully delivered ${sentCount}/${subs.length} alerts to phone lock screen`);
    return { sent: sentCount, total: subs.length };
  } catch (err) {
    console.error('[WebPush] Dispatch error:', err.message);
    return { sent: 0, error: err.message };
  }
}

// ---------------- API ROUTES ----------------

// 1. Health & Database Status
app.get('/api/status', async (req, res) => {
  let counts = { groups: 0, members: 0, payments: 0, lottery: 0, liftings: 0 };
  if (isMongoConnected) {
    counts = {
      groups: await GroupModel.countDocuments(),
      members: await MemberModel.countDocuments(),
      payments: await PaymentModel.countDocuments(),
      lottery: await LotteryModel.countDocuments(),
      liftings: await LiftingModel.countDocuments()
    };
  } else {
    counts = {
      groups: memoryStore.groups.length,
      members: memoryStore.members.length,
      payments: memoryStore.payments.length,
      lottery: memoryStore.lottery.length,
      liftings: (memoryStore.liftings || []).length
    };
  }

  res.json({
    status: 'online',
    isMongoConnected,
    database: isMongoConnected ? 'MongoDB Atlas (Live)' : 'In-Memory / Local Storage Sync',
    counts,
    timestamp: new Date().toISOString()
  });
});

// 2. Truncate Database (Clean Flow Testing as requested by user!)
app.post('/api/db/truncate', async (req, res) => {
  try {
    await truncateDatabase();
    res.json({
      success: true,
      message: 'Database truncated successfully. All collections cleared for clean flow testing.',
      isMongoConnected
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Seed Database
app.post('/api/db/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({
      success: true,
      message: 'Database seeded with default Sri Varalaxmi Chits test data.',
      isMongoConnected
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Groups Management (Multiple Chit Groups - Section 17)
app.get('/api/groups', async (req, res) => {
  if (isMongoConnected) {
    const groups = await GroupModel.find({});
    return res.json(groups);
  }
  res.json(memoryStore.groups);
});

app.post('/api/groups', async (req, res) => {
  const newGroup = {
    id: `grp-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };

  if (isMongoConnected) {
    const saved = await GroupModel.create(newGroup);
    return res.json(saved);
  }
  memoryStore.groups.push(newGroup);
  res.json(newGroup);
});

app.put('/api/groups/:groupId', async (req, res) => {
  const { groupId } = req.params;
  if (isMongoConnected) {
    const updated = await GroupModel.findOneAndUpdate({ id: groupId }, { $set: req.body }, { new: true });
    return res.json(updated);
  }
  const g = memoryStore.groups.find(group => group.id === groupId);
  if (g) Object.assign(g, req.body);
  res.json(g);
});

// 5. Members Management
app.get('/api/members', async (req, res) => {
  if (isMongoConnected) {
    const members = await MemberModel.find({});
    return res.json(members);
  }
  res.json(memoryStore.members);
});

app.get('/api/members/lookup', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });
  const cleanPhone = phone.toString().trim();
  if (isMongoConnected) {
    const members = await MemberModel.find({ phone: cleanPhone });
    return res.json(members);
  }
  const members = memoryStore.members.filter(m => m.phone === cleanPhone);
  res.json(members);
});

app.get('/api/groups/:groupId/members', async (req, res) => {
  const { groupId } = req.params;
  if (isMongoConnected) {
    const members = await MemberModel.find({ groupId });
    return res.json(members);
  }
  const members = memoryStore.members.filter(m => m.groupId === groupId);
  res.json(members);
});

app.post('/api/groups/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const memberName = req.body.name || 'Member';
    
    // Auto-calculate sequential member number (#1 to #20)
    let memberNo = Number(req.body.memberNo);
    if (!memberNo || memberNo < 1) {
      const existingCount = isMongoConnected 
        ? await MemberModel.countDocuments({ groupId, role: { $ne: 'organizer' } }) 
        : memoryStore.members.filter(m => m.groupId === groupId && m.role !== 'organizer').length;
      memberNo = existingCount + 1;
    }

    const newMember = {
      id: req.body.id || `m-${Date.now()}`,
      groupId,
      memberNo,
      name: memberName,
      nameTe: req.body.nameTe || memberName,
      phone: req.body.phone || '',
      pin: req.body.pin || '1234',
      role: 'member',
      totalPaidSoFar: Number(req.body.totalPaidSoFar) || 0,
      hasLiftedChit: Boolean(req.body.hasLiftedChit) || false,
      liftedMonth: req.body.liftedMonth || null,
      createdAt: new Date()
    };

    if (isMongoConnected) {
      const saved = await MemberModel.create(newMember);
      return res.json(saved);
    }
    memoryStore.members.push(newMember);
    res.json(newMember);
  } catch (err) {
    console.error('Error adding member:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    if (isMongoConnected) {
      const updated = await MemberModel.findOneAndUpdate(
        { id: memberId },
        { $set: req.body },
        { returnDocument: 'after' }
      );
      return res.json(updated);
    }
    const m = memoryStore.members.find(item => item.id === memberId);
    if (m) Object.assign(m, req.body);
    res.json(m);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/members/:memberId', async (req, res) => {
  try {
    const { memberId } = req.params;
    if (isMongoConnected) {
      await MemberModel.deleteOne({ id: memberId });
      return res.json({ success: true });
    }
    memoryStore.members = memoryStore.members.filter(m => m.id !== memberId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Payments Management (With Proof Screenshot - Section 6)
app.get('/api/groups/:groupId/payments', async (req, res) => {
  const { groupId } = req.params;
  if (isMongoConnected) {
    const payments = await PaymentModel.find({ groupId });
    return res.json(payments);
  }
  const payments = memoryStore.payments.filter(p => p.groupId === groupId);
  res.json(payments);
});

app.post('/api/groups/:groupId/payments', async (req, res) => {
  const { groupId } = req.params;
  const newPayment = {
    id: `pay-${Date.now()}`,
    groupId,
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    receiptNo: `SVC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
    ...req.body
  };

  const notif = {
    id: `notif-${Date.now()}`,
    groupId,
    title: 'New Payment Received',
    titleTe: 'కొత్త పేమెంట్ వచ్చింది',
    message: `${newPayment.memberName} submitted Month ${newPayment.month} installment of ₹${newPayment.amount.toLocaleString('en-IN')} via ${newPayment.paymentMode || 'UPI'}.`,
    messageTe: `${newPayment.memberName} గారు నెల ${newPayment.month} వాయిదా సొమ్ము ₹${newPayment.amount.toLocaleString('en-IN')} (${newPayment.paymentMode || 'UPI'}) ద్వారా చెల్లించారు. పరిశీలించి ఆమోదించండి.`,
    type: 'payment',
    date: new Date().toISOString().split('T')[0],
    targetRole: 'organizer'
  };

  if (isMongoConnected) {
    const saved = await PaymentModel.create(newPayment);
    await NotificationModel.create(notif).catch(() => {});
    sendPushNotification({}, {
      title: '💰 కొత్త పేమెంట్ సమర్పించబడింది!',
      body: `${newPayment.memberName} (నెల ${newPayment.month}) ₹${newPayment.amount.toLocaleString('en-IN')} చెల్లించారు. పరిశీలించండి.`
    }).catch(() => {});
    return res.json(saved);
  }
  memoryStore.payments.push(newPayment);
  if (!memoryStore.notifications) memoryStore.notifications = [];
  memoryStore.notifications.unshift(notif);
  sendPushNotification({}, {
    title: '💰 కొత్త పేమెంట్ సమర్పించబడింది!',
    body: `${newPayment.memberName} (నెల ${newPayment.month}) ₹${newPayment.amount.toLocaleString('en-IN')} చెల్లించారు. పరిశీలించండి.`
  }).catch(() => {});
  res.json(newPayment);
});

app.put('/api/payments/:paymentId/approve', async (req, res) => {
  const { paymentId } = req.params;
  if (isMongoConnected) {
    const updated = await PaymentModel.findOneAndUpdate(
      { id: paymentId },
      { status: 'approved', approvedAt: new Date() },
      { new: true }
    );
    if (updated) {
      await MemberModel.findOneAndUpdate(
        { id: updated.memberId },
        { $inc: { totalPaidSoFar: updated.amount } }
      );
      // Auto notification
      await NotificationModel.create({
        id: `notif-${Date.now()}`,
        groupId: updated.groupId,
        title: 'Payment Approved',
        titleTe: '✅ పేమెంట్ ఆమోదించబడింది',
        message: `Payment of ₹${updated.amount.toLocaleString('en-IN')} for Month ${updated.month} approved! Receipt: ${updated.receiptNo}.`,
        messageTe: `నెల ${updated.month} వాయిదా ₹${updated.amount.toLocaleString('en-IN')} ఆమోదించబడింది! అధికారిక రసీదు: ${updated.receiptNo}.`,
        type: 'payment',
        date: new Date().toISOString().split('T')[0],
        targetRole: 'member',
        targetMemberId: updated.memberId
      }).catch(() => {});

      sendPushNotification({}, {
        title: '✅ పేమెంట్ ఆమోదించబడింది!',
        body: `${updated.memberName} గారి నెల ${updated.month} వాయిదా ₹${updated.amount.toLocaleString('en-IN')} ఆమోదించబడింది! రసీదు: ${updated.receiptNo}.`
      }).catch(() => {});
    }
    return res.json(updated);
  }
  const p = memoryStore.payments.find(item => item.id === paymentId);
  if (p) {
    p.status = 'approved';
    const m = memoryStore.members.find(item => item.id === p.memberId);
    if (m) m.totalPaidSoFar = (m.totalPaidSoFar || 0) + p.amount;

    if (!memoryStore.notifications) memoryStore.notifications = [];
    memoryStore.notifications.unshift({
      id: `notif-${Date.now()}`,
      groupId: p.groupId,
      title: 'Payment Approved',
      titleTe: '✅ పేమెంట్ ఆమోదించబడింది',
      message: `Payment of ₹${p.amount.toLocaleString('en-IN')} for Month ${p.month} approved! Receipt: ${p.receiptNo}.`,
      messageTe: `నెల ${p.month} వాయిదా ₹${p.amount.toLocaleString('en-IN')} ఆమోదించబడింది! అధికారిక రసీదు: ${p.receiptNo}.`,
      type: 'payment',
      date: new Date().toISOString().split('T')[0],
      targetRole: 'member',
      targetMemberId: p.memberId
    });

    sendPushNotification({}, {
      title: '✅ పేమెంట్ ఆమోదించబడింది!',
      body: `${p.memberName} గారి నెల ${p.month} వాయిదా ₹${p.amount.toLocaleString('en-IN')} ఆమోదించబడింది! రసీదు: ${p.receiptNo}.`
    }).catch(() => {});
  }
  res.json(p);
});

app.put('/api/payments/:paymentId/reject', async (req, res) => {
  const { paymentId } = req.params;
  if (isMongoConnected) {
    const updated = await PaymentModel.findOneAndUpdate(
      { id: paymentId },
      { status: 'rejected' },
      { new: true }
    );
    return res.json(updated);
  }
  const p = memoryStore.payments.find(item => item.id === paymentId);
  if (p) p.status = 'rejected';
  res.json(p);
});

// 7. Transparent Lottery Draw & Audit Trail (Section 5 & 18)
app.post('/api/groups/:groupId/lottery/draw', async (req, res) => {
  const { groupId } = req.params;
  const { month, winnerId, winnerName, winnerNameTe, eligibleCount, auditRef, excludedMembers } = req.body;

  const lotteryRecord = {
    id: `lot-${Date.now()}`,
    groupId,
    month,
    winnerMemberId: winnerId,
    winnerName,
    winnerNameTe,
    drawnAt: new Date().toISOString(),
    eligibleMemberCount: eligibleCount,
    auditRef: auditRef || `AUDIT-LOT-${Date.now()}`,
    excludedMembers: excludedMembers || []
  };

  if (isMongoConnected) {
    await LotteryModel.create(lotteryRecord);
    await MemberModel.findOneAndUpdate({ id: winnerId }, { hasLiftedChit: true, liftedMonth: month });
  } else {
    memoryStore.lottery.push(lotteryRecord);
    const m = memoryStore.members.find(mem => mem.id === winnerId);
    if (m) {
      m.hasLiftedChit = true;
      m.liftedMonth = month;
    }
  }

  sendPushNotification({}, {
    title: `🎉 లక్కీ డ్రా విజేత: ${winnerNameTe || winnerName}`,
    body: `నెల ${month} లక్కీ డ్రాలో ${winnerNameTe || winnerName} గారు ₹2,00,000 చిట్ గెలుచుకున్నారు! శుభాకాంక్షలు!`
  }).catch(() => {});

  res.json(lotteryRecord);
});

app.get('/api/groups/:groupId/lottery', async (req, res) => {
  const { groupId } = req.params;
  if (isMongoConnected) {
    const records = await LotteryModel.find({ groupId });
    return res.json(records);
  }
  const records = memoryStore.lottery.filter(l => l.groupId === groupId);
  res.json(records);
});

// 8. Monthly Chit Lifting & Auction Tracking (పాట పాడుకున్నవారి వివరాలు - Section 3, 4, 5)
app.get('/api/groups/:groupId/liftings', async (req, res) => {
  const { groupId } = req.params;
  if (isMongoConnected) {
    const liftings = await LiftingModel.find({ groupId }).sort({ month: 1 });
    return res.json(liftings);
  }
  const liftings = (memoryStore.liftings || []).filter(l => l.groupId === groupId);
  res.json(liftings);
});

app.post('/api/groups/:groupId/liftings', async (req, res) => {
  const { groupId } = req.params;
  const { 
    month, 
    memberId, 
    memberName, 
    memberNameTe, 
    memberNo,
    liftType, 
    chitValue, 
    bidDiscount, 
    organizerCommission, 
    netDistributedAmount, 
    dividendPerMember, 
    notes 
  } = req.body;

  const newLifting = {
    id: `lift-${Date.now()}`,
    groupId,
    month: Number(month),
    memberId,
    memberName,
    memberNameTe: memberNameTe || memberName,
    memberNo: Number(memberNo),
    liftType: liftType || 'auction',
    chitValue: Number(chitValue) || 200000,
    bidDiscount: Number(bidDiscount) || 0,
    organizerCommission: Number(organizerCommission) || 10000,
    netDistributedAmount: Number(netDistributedAmount) || (200000 - (Number(bidDiscount) || 0)),
    dividendPerMember: Number(dividendPerMember) || 0,
    date: new Date().toISOString().split('T')[0],
    status: 'distributed',
    notes: notes || '',
    createdAt: new Date()
  };

  const notif = {
    id: `notif-${Date.now()}`,
    groupId,
    title: `Month ${month} Chit Winner: ${newLifting.memberName}`,
    titleTe: `🏆 నెల ${month} చిట్ పాట విజేత: ${newLifting.memberNameTe}`,
    message: `${newLifting.memberName} lifted Month ${month} chit for ₹${newLifting.netDistributedAmount.toLocaleString('en-IN')} (${newLifting.liftType === 'auction' ? 'Auction Bid' : 'Lucky Draw'}).`,
    messageTe: `${newLifting.memberNameTe} గారు నెల ${month} చిట్ ను ₹${newLifting.netDistributedAmount.toLocaleString('en-IN')} చేతికి తీసుకున్నారు (${newLifting.liftType === 'auction' ? 'వేలం పాట' : 'లక్కీ డ్రా'}).`,
    type: 'lottery',
    date: new Date().toISOString().split('T')[0],
    targetRole: 'all'
  };

  if (isMongoConnected) {
    const saved = await LiftingModel.create(newLifting);
    await NotificationModel.create(notif).catch(() => {});
    // Mark member as lifted in MongoDB
    await MemberModel.findOneAndUpdate(
      { id: memberId },
      { hasLiftedChit: true, liftedMonth: Number(month) }
    );
    sendPushNotification({}, {
      title: `🏆 నెల ${month} చిట్ పాట విజేత: ${newLifting.memberNameTe || newLifting.memberName}`,
      body: `${newLifting.memberNameTe || newLifting.memberName} గారు ₹${newLifting.netDistributedAmount.toLocaleString('en-IN')} చిట్ తీసుకున్నారు (${newLifting.liftType === 'auction' ? 'వేలం పాట' : 'లక్కీ డ్రా'}).`
    }).catch(() => {});
    return res.json(saved);
  }

  if (!memoryStore.liftings) memoryStore.liftings = [];
  memoryStore.liftings.push(newLifting);
  if (!memoryStore.notifications) memoryStore.notifications = [];
  memoryStore.notifications.unshift(notif);

  const m = memoryStore.members.find(mem => mem.id === memberId);
  if (m) {
    m.hasLiftedChit = true;
    m.liftedMonth = Number(month);
  }

  sendPushNotification({}, {
    title: `🏆 నెల ${month} చిట్ పాట విజేత: ${newLifting.memberNameTe || newLifting.memberName}`,
    body: `${newLifting.memberNameTe || newLifting.memberName} గారు ₹${newLifting.netDistributedAmount.toLocaleString('en-IN')} చిట్ తీసుకున్నారు (${newLifting.liftType === 'auction' ? 'వేలం పాట' : 'లక్కీ డ్రా'}).`
  }).catch(() => {});

  res.json(newLifting);
});

// 9. Dynamic Notifications API (Cross-Tab & Real-Time Sync)
app.get('/api/groups/:groupId/notifications', async (req, res) => {
  const { groupId } = req.params;
  if (isMongoConnected) {
    const list = await NotificationModel.find({ groupId }).sort({ createdAt: -1 }).limit(30);
    return res.json(list);
  }
  const list = (memoryStore.notifications || []).filter(n => n.groupId === groupId);
  res.json(list);
});

app.post('/api/groups/:groupId/notifications', async (req, res) => {
  const { groupId } = req.params;
  const newNotif = {
    id: `notif-${Date.now()}`,
    groupId,
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date(),
    ...req.body
  };
  if (isMongoConnected) {
    const saved = await NotificationModel.create(newNotif);
    return res.json(saved);
  }
  if (!memoryStore.notifications) memoryStore.notifications = [];
  memoryStore.notifications.unshift(newNotif);
  res.json(newNotif);
});

// 10. Web Push Notification Subscriptions & Testing
app.post('/api/notifications/subscribe', async (req, res) => {
  try {
    const { subscription, memberId, phone, role } = req.body;
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription object' });
    }
    const doc = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      memberId: memberId || 'anonymous',
      phone: phone || '',
      role: role || 'member',
      subscribedAt: new Date()
    };
    if (isMongoConnected) {
      await SubscriptionModel.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        doc,
        { upsert: true, new: true }
      );
    }
    if (!memoryStore.subscriptions) memoryStore.subscriptions = [];
    const idx = memoryStore.subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
    if (idx >= 0) {
      memoryStore.subscriptions[idx] = doc;
    } else {
      memoryStore.subscriptions.push(doc);
    }
    console.log('[WebPush] Saved subscription for phone/role:', phone, role);
    res.json({ success: true, message: 'Subscription saved successfully' });
  } catch (err) {
    console.error('[WebPush Subscribe Error]', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

app.post('/api/notifications/test', async (req, res) => {
  const { memberId, role, title, body } = req.body;
  const filter = {};
  if (memberId) filter.memberId = memberId;
  if (role) filter.role = role;
  const result = await sendPushNotification(filter, {
    title: title || '🔔 శ్రీ వరలక్ష్మి చిట్స్ ఫోన్ అలర్ట్!',
    body: body || 'మీ మొబైల్ లాక్-స్క్రీన్ పుష్ నోటిఫికేషన్‌లు విజయవంతంగా కనెక్ట్ అయ్యాయి.'
  });
  res.json({ success: true, result });
});

// Centralized Express Error Handling Middleware (prevents crashing from malformed requests)
app.use((err, req, res, next) => {
  console.error('Express Error caught:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server & Connect MongoDB Atlas
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 Varalaxmi Chits API Server running on port ${PORT}`);
    await connectDB();
  });
} else {
  // On Vercel Serverless environment, ensure DB connection is initialized
  connectDB().catch(err => console.error('Vercel DB connection error:', err));
}

export default app;

