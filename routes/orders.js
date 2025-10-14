import express from "express";
import { ObjectId } from "mongodb";

const router = express.Router();

//POST request to update the orders collection
router.post("/order", async (req, res) => {
  const order = req.body;
  const db = req.app.locals.db;

  try {
    const result = await db.collection("Orders").insertOne(order);

    res.status(201).json({
      message: "Order completed successfully",
      orderId: result.insertedId.toString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
