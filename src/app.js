import express from "express";
import { config } from "./config.js";

import router from "./routes/index.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(express.json());
app.use("/", router);
app.use("/api/auth", authRoutes);

const PORT = config.app.port;
app.listen(PORT, () => {
  console.log(`端口 ${PORT}`);
});
