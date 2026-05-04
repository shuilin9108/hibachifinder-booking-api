require("dotenv").config();
const mongoose = require("mongoose");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const AdminUser = mongoose.model(
    "AdminUser",
    new mongoose.Schema({}, { strict: false }),
    "adminusers"
  );

  const updates = [
    ["admin@shuilink.com", "pa-00001"],
    ["hibachifinder@gmail.com", "pa-00002"],
    ["shuilin9108@gmail.com", "pa-00003"],
    ["kobehibachicatering@gmail.com", "kbo-00001"],
    ["zjxinnn@gmail.com", "kbs-00001"],
    ["jasonzheng2016@gmail.com", "kbs-00002"],
    ["shui.lin@stonybrook.edu", "kbc-00001"],
    ["a1hibachiparty@gmail.com", "a1o-00001"],
    ["yuangao202121@gmail.com", "a1s-00001"],
    ["shuilin0823@gmail.com", "a1c-00001"],
    ["hibachinearby@gmail.com", "hno-00001"],
    ["2235869122@qq.com", "hns-00001"],
    ["274530127@qq.com", "hnc-00001"],
  ];

  for (const [email, id] of updates) {
    await AdminUser.updateOne(
      { email },
      { $set: { platformUserId: id } }
    );
    console.log("Updated:", email, "→", id);
  }

  console.log("✅ DONE");
  process.exit();
}

run();