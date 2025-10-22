import path from "node:path";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { router } from "./routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

const publicDir = path.resolve(process.cwd(), "public");
app.use("/uploads", express.static(publicDir));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", router);

app.use(errorHandler);

export { app };
