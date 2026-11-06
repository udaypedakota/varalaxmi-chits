const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
require('dotenv').config();

async function resetTestLifting() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const Lifting = mongoose.model('Lifting', new mongoose.Schema({}, { strict: false }));
  const Member = mongoose.model('Member', new mongoose.Schema({}, { strict: false }));
  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));
  const Lottery = mongoose.model('Lottery', new mongoose.Schema({}, { strict: false }));

  const delLift = await Lifting.deleteMany({});
  console.log('Deleted liftings records:', delLift.deletedCount);

  const delLot = await Lottery.deleteMany({});
  console.log('Deleted lottery records:', delLot.deletedCount);

  const delPay = await Payment.deleteMany({});
  console.log('Deleted payments records:', delPay.deletedCount);

  const updMem = await Member.updateMany({}, { 
    $set: { 
      hasLiftedChit: false, 
      liftedMonth: null, 
      totalPaidSoFar: 0 
    } 
  });
  console.log('Reset members count:', updMem.modifiedCount);

  const allMembers = await Member.find({});
  console.log('Cleaned Members:', allMembers.map(m => ({ 
    memberNo: m.memberNo,
    name: m.name, 
    phone: m.phone, 
    hasLiftedChit: m.hasLiftedChit, 
    liftedMonth: m.liftedMonth 
  })));

  await mongoose.disconnect();
  console.log('Done!');
}

resetTestLifting().catch(console.error);
