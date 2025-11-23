import dotenv from "dotenv";
dotenv.config();

import express from "express";
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

// Serve local images if present
const localImagesDir = path.join(__dirname, "images");
if (fs.existsSync(localImagesDir)) {
  app.use(
    "/images",
    express.static(localImagesDir, {
      maxAge: "1d",
      setHeaders: (res) => {
        res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
      },
    })
  );
} else {
  console.log("Image or directory not found!");
}

// Health check for root note
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
