import express from "express";
import session from "express-session";
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

//Initializing the session
app.use(express.json());
app.use(
  session({
    secret: "Sanish12",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Serve lesson images with existence check
app.get("/images/:imageName", (req, res, next) => {
  const imagePath = path.join(
    __dirname,
    "public",
    "images",
    req.params.imageName
  );

  fs.access(imagePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: "Lesson image not found" });
    }
    next();
  });
});
//Serving the public folder
app.use(express.static(path.join(__dirname, "public")));

//Serving the index.HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use(logger);

//Routes for our requests
app.use("/", lessonRoutes);
app.use("/", ordersRoutes);

const port = 8000;
const hostname = "localhost";

//Connecting to the DB
async function startServer() {
  try {
    const client = await connectToDb();
    app.locals.db = client.db("VueEcommerce");

    app.listen(port, () => {
      console.log(`Server listening on http://${hostname}:${port}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
  }
}

startServer();