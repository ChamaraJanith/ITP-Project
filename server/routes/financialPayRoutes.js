import express from "express";
import {
  getAllNotes,
  getNoteById,
  createNote,
  deleteNote,
  updateNote,
} from "../controller/financialPayController.js";
import Payment from "../model/FinancialPayModal.js";

const paymentRouter = express.Router();

// --- CRUD routes ---
paymentRouter.get("/", getAllNotes);
paymentRouter.get("/payments/:id", getNoteById);
paymentRouter.post("/payments", createNote);
paymentRouter.put("/payments/:id", updateNote);
paymentRouter.delete("/payments/:id", deleteNote);

// --- Payments API (for frontend table) ---
paymentRouter.get("/payments", async (req, res) => {
  try {
    const payments = await Payment.find();

    // format for frontend
    const formatted = payments.map((p) => ({
      _id: p._id,
      invoiceNumber: p.invoiceNumber,
      hospitalName: p.hospitalName,
      branchName: p.branchName,
      patientName: p.patientName,
      doctorName: p.doctorName,
      department: p.department,
      totalAmount: p.totalAmount,
      amountPaid: p.amountPaid,
      balance: p.balance,
      paymentMethod: p.paymentMethod,
      note: p.note,
      date: p.date ? p.date.toISOString().split("T")[0] : "",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Fetch payments error:", err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

export default paymentRouter;
