//只负责启动服务。
require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Booking Engine API listening on http://localhost:${PORT}`);
});