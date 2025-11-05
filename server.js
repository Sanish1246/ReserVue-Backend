import dotenv from "dotenv";
dotenv.config();

import express from "express";
import session from "express-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { connectToDb } from "./db.js";
import fs from "fs";

//Routes
import lessonRoutes from "./routes/lessons.js";
import ordersRoutes from "./routes/orders.js";

// logger middleware function
function logger(req, res, next) {
  const now = new Date();
  console.log(`[${now.toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log("--------------------------------------------------");
  next();
}

//Initializing express
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trusting Proxy if developing for production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

//Express Middleware
app.use(express.json());

// Configuring CORS to allow requests from the frontend hosted on GitHub Pages
//Else all requests from the frontend will be rejected by the server
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "https://sanish1246.github.io";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// Initializing session using environment secret
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

const frontendBaseForAssets = (
  process.env.FRONTEND_ASSET_BASE ||
  process.env.FRONTEND_ORIGIN ||
  "https://sanish1246.github.io/ReserVue"
).replace(/\/$/, ""); // ensure no trailing slash

// Always redirect image requests to GitHub Pages frontend
app.get("/images/:imageName", (req, res) => {
  const imageUrl = `${frontendBaseForAssets}/ReserVue/images/${encodeURIComponent(
    req.params.imageName
  )}`;
  return res.redirect(imageUrl);
});

// Health check or root note
app.get("/", (req, res) => {
  res.send(
    "Backend running. Frontend is hosted at https://sanish1246.github.io/ReserVue/"
  );
});

app.use(logger);

//Routes for our requests
app.use("/", lessonRoutes);
app.use("/", ordersRoutes);

const port = process.env.PORT || 8000;

//Connecting to the DB
async function startServer() {
  try {
    const client = await connectToDb();
    app.locals.db = client.db(process.env.DB_NAME || "VueEcommerce");

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
}

startServer();
