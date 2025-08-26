import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    hospitalName: { type: String, required: true },
    branchName: { type: String },
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },

    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },
    patientName: { type: String, required: true },
    patientPhone: { type: String },
    patientEmail: { type: String },
    patientAddress: { type: String },

    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    doctorName: { type: String },
    department: { type: String },

    services: [
      {
        serviceType: { type: String, required: true },
        description: { type: String },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        subtotal: { type: Number, required: true },
      },
    ],

    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    balance: { type: Number, default: 0 },

    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Insurance", "Online", "Wallet"],
      required: true,
      set: (v) => {
        if (!v) return v;
        const normalized = v.toLowerCase();
        switch (normalized) {
          case "cash":
            return "Cash";
          case "card":
            return "Card";
          case "insurance":
            return "Insurance";
          case "online":
            return "Online";
          case "wallet":
            return "Wallet";
          default:
            return v; // fallback to original, will validate later
        }
      },
    },

    terms: { type: String },
    note: { type: String },
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
