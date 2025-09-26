import express from "express";
import { config } from "./config.js";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import router from "./routes/index.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/", express.static(path.join(__dirname, "public")));

const PORT = config.app.port;
app.listen(PORT, () => {
  console.log(`端口 ${PORT}`);
});
