const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://ramukorla3_db_user:Uday8329@badmintiondatabase.vizmqp0.mongodb.net/varalaxmi_chits?retryWrites=true&w=majority';

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    const db = client.db('varalaxmi_chits');

    // Delete members
    const mRes = await db.collection('members').deleteMany({});
    console.log('Deleted members:', mRes.deletedCount);

    // Delete payments
    const pRes = await db.collection('payments').deleteMany({});
    console.log('Deleted payments:', pRes.deletedCount);

    // Delete liftings
    const lRes = await db.collection('liftings').deleteMany({});
    console.log('Deleted liftings:', lRes.deletedCount);

    // Delete lotteries
    const lotRes = await db.collection('lotteries').deleteMany({});
    console.log('Deleted lotteries:', lotRes.deletedCount);

    // Delete notifications
    const nRes = await db.collection('notifications').deleteMany({});
    console.log('Deleted notifications:', nRes.deletedCount);

    // Delete auditlogs
    const aRes = await db.collection('auditlogs').deleteMany({});
    console.log('Deleted auditlogs:', aRes.deletedCount);

    // Delete subscriptions
    const sRes = await db.collection('subscriptions').deleteMany({});
    console.log('Deleted subscriptions:', sRes.deletedCount);

    // Reset groups to Month 1 clean slate
    const gRes = await db.collection('groups').updateMany({}, {
      $set: {
        currentMonth: 1,
        totalValue: 200000,
        totalMonths: 20,
        totalMembers: 20,
        monthlyInstallment: 10000,
        fixedTakenInstallment: 11500,
        commissionPercent: 5,
        status: 'active'
      }
    });
    console.log('Reset groups to Month 1:', gRes.modifiedCount);

    console.log('\n--- POST TRUNCATE VERIFICATION ---');
    console.log('Members count:', await db.collection('members').countDocuments());
    console.log('Payments count:', await db.collection('payments').countDocuments());
    console.log('Liftings count:', await db.collection('liftings').countDocuments());
    console.log('Lotteries count:', await db.collection('lotteries').countDocuments());
    console.log('Notifications count:', await db.collection('notifications').countDocuments());
    console.log('AuditLogs count:', await db.collection('auditlogs').countDocuments());
    console.log('Subscriptions count:', await db.collection('subscriptions').countDocuments());

    const groups = await db.collection('groups').find({}).toArray();
    console.log('Groups state:', groups.map(g => ({
      id: g.id,
      name: g.name,
      currentMonth: g.currentMonth,
      totalMembers: g.totalMembers,
      totalMonths: g.totalMonths,
      totalValue: g.totalValue
    })));

  } finally {
    await client.close();
  }
}

main().catch(console.error);

