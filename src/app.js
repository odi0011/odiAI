import express from "express";
import dotenv from "dotenv";
import router from "./routes/index.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器已经启动，监听端口 ${PORT}`);
});
