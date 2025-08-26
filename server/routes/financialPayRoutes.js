import express from "express";
import Payment from "../model/FinancialPayModal.js";

const paymentRouter = express.Router();

// GET all payments
paymentRouter.get("/", async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });

    // Format for frontend
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
      balance: p.totalAmount - p.amountPaid, // Calculate balance
      paymentMethod: p.paymentMethod,
      note: p.note,
      date: p.createdAt ? p.createdAt.toISOString().split("T")[0] : "",
    }));

    res.json(formatted);
  } catch (err) {
    console.error("❌ Fetch payments error:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch payments",
      message: err.message 
    });
  }
});

// GET payment by ID
paymentRouter.get("/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ 
        success: false,
        message: "Payment not found" 
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (err) {
    console.error("❌ Get payment error:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to get payment",
      message: err.message 
    });
  }
});

// POST - Create new payment
paymentRouter.post("/", async (req, res) => {
  try {
    console.log("📝 Creating payment with data:", req.body);

    const {
      hospitalName,
      branchName,
      invoiceNumber,
      patientName,
      doctorName,
      totalAmount,
      amountPaid,
      paymentMethod,
      note,
    } = req.body;

    // Validation
    if (!hospitalName || !invoiceNumber || !patientName || !totalAmount || !amountPaid) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: hospitalName, invoiceNumber, patientName, totalAmount, amountPaid"
      });
    }

    // Check for duplicate invoice number (optional)
    const existingPayment = await Payment.findOne({ invoiceNumber });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment with this invoice number already exists"
      });
    }

    // Create new payment
    const newPayment = new Payment({
      hospitalName: hospitalName.trim(),
      branchName: branchName?.trim() || "",
      invoiceNumber: invoiceNumber.trim(),
      patientName: patientName.trim(),
      doctorName: doctorName?.trim() || "",
      totalAmount: Number(totalAmount),
      amountPaid: Number(amountPaid),
      balance: Number(totalAmount) - Number(amountPaid),
      paymentMethod: paymentMethod || "Cash",
      note: note?.trim() || "",
    });

    const savedPayment = await newPayment.save();
    console.log("✅ Payment created successfully:", savedPayment._id);

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: savedPayment
    });

  } catch (err) {
    console.error("❌ Create payment error:", err);
    res.status(400).json({
      success: false,
      error: "Failed to create payment",
      message: err.message
    });
  }
});

// PUT - Update payment
paymentRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Calculate balance if amounts are provided
    if (updateData.totalAmount && updateData.amountPaid) {
      updateData.balance = Number(updateData.totalAmount) - Number(updateData.amountPaid);
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    console.log("✅ Payment updated successfully:", id);

    res.json({
      success: true,
      message: "Payment updated successfully",
      data: updatedPayment
    });

  } catch (err) {
    console.error("❌ Update payment error:", err);
    res.status(400).json({
      success: false,
      error: "Failed to update payment",
      message: err.message
    });
  }
});

// DELETE payment
paymentRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedPayment = await Payment.findByIdAndDelete(id);

    if (!deletedPayment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    console.log("✅ Payment deleted successfully:", id);

    res.json({
      success: true,
      message: "Payment deleted successfully"
    });

  } catch (err) {
    console.error("❌ Delete payment error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete payment",
      message: err.message
    });
  }
});

export default paymentRouter;
