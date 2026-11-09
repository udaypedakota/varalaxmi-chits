const mongoose = require('mongoose');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const Member = mongoose.model('Member', new mongoose.Schema({}, { strict: false }));

  // Update Rajesh to #13
  const res = await Member.updateOne({ id: 'm-1794218703575' }, { $set: { memberNo: 13 } });
  console.log('Updated Rajesh to #13:', res);

  const all = await Member.find({}).sort({ memberNo: 1 });
  console.log('Total members count:', all.length);
  all.forEach(m => console.log(`#${m.memberNo} ${m.name} (${m.phone})`));

  await mongoose.disconnect();
}

fix().catch(console.error);

