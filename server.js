// ...existing code...
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
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("--------------------------------------------------");
  next();
}

//Initializing express
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trust first proxy when in production (Render/GitHub Pages reverse proxies)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Middleware
app.use(express.json());

// Configure CORS to allow the frontend hosted on GitHub Pages
// NOTE: CORS origin should be the origin (no path), e.g. "https://sanish1246.github.io"
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "https://sanish1246.github.io";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// Initialize session using environment secret
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

// Static/public handling:
// If a local public/index.html exists (dev or if you included frontend in repo), serve it.
// Otherwise don't attempt to serve static files and redirect image requests to the GitHub Pages site.
const publicDir = path.join(__dirname, "public");
const publicIndexPath = path.join(publicDir, "index.html");
const frontendBaseForAssets = (
  process.env.FRONTEND_ASSET_BASE ||
  process.env.FRONTEND_ORIGIN +
    (process.env.FRONTEND_ORIGIN?.endsWith("/") ? "" : "") || // fallback
  "https://sanish1246.github.io/ReserVue"
).replace(/\/$/, ""); // ensure no trailing slash

if (fs.existsSync(publicIndexPath)) {
  // Serve lesson images with existence check (local public folder exists)
  app.get("/images/:imageName", (req, res, next) => {
    const imagePath = path.join(publicDir, "images", req.params.imageName);

    fs.access(imagePath, fs.constants.F_OK, (err) => {
      if (err) {
        return res.status(404).json({ error: "Lesson image not found" });
      }
      // send the actual file
      res.sendFile(imagePath);
    });
  });

  //Serving the public folder
  app.use(express.static(publicDir));

  //Serving the index.HTML file
  app.get("/", (req, res) => {
    res.sendFile(publicIndexPath);
  });
} else {
  // No local public files — redirect image requests to the GitHub Pages frontend
  app.get("/images/:imageName", (req, res) => {
    const imageUrl = `${frontendBaseForAssets}/ReserVue/images/${encodeURIComponent(
      req.params.imageName
    )}`;
    return res.redirect(imageUrl);
  });

  // Optional root note / health check can remain; do not serve index.html
  app.get("/", (req, res) => {
    res.send(
      "Backend running. Frontend is hosted separately at https://sanish1246.github.io/ReserVue/"
    );
  });
}

app.use(logger);

//Routes for our requests
app.use("/", lessonRoutes);
app.use("/", ordersRoutes);

const port = process.env.PORT || 8000;
// hostname is not required when deploying to platforms which bind automatically

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
// ...existing code...
