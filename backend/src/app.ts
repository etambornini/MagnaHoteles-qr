import path from "node:path";
import fs from "node:fs";
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

const frontendDir = path.resolve(process.cwd(), "../frontend/dist");

if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    if (req.method !== "GET") {
      return next();
    }
    res.sendFile(path.join(frontendDir, "index.html"));
  });
}

app.use(errorHandler);

export { app };
