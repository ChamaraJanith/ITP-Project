import payments from "../model/FinancialPayModal.js";
import paymentRouter from "../routes/financialPayRoutes.js";
// ✅ Read all Notes
export const getAllNotes = async (req, res) => {
    
    try {
        const notes = await payments.find().sort({ createdAt: -1 });
        res.status(200).json(notes);
    } catch (error) {
        console.error('❌ Get all notes error:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

// ✅ Read all Notes by ID
export const getNoteById = async (req, res) => {
     try {
        const { id } = req.params;
        const note = await payments.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }  
        res.status(200).json(note);

     } catch (error) {
        console.error('❌ Get Note by id error:', error);
        res.status(500).json({ message: "Internal server error", error: error.message });
     }

}

// ✅ Create Financial Transaction
export const createNote = async (req, res) => {
  try {
    const newTransaction = new payments(req.body); // takes all fields from body
    await newTransaction.save();

    res.status(201).json({
      message: "Transaction created successfully",
      transaction: newTransaction
    });
  } catch (error) {
    console.error("❌ Create transaction error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};


export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedTransaction = await payments.findByIdAndUpdate(
      id,
      req.body, // directly update with provided fields
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: updatedTransaction
    });
  } catch (error) {
    console.error("❌ Update transaction error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

// ✅ Delete Note
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedNote = await payments.findByIdAndDelete(id);

    if (!deletedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.status(200).json({
      message: "Note deleted successfully",
      note: deletedNote
    });
  } catch (error) {
    console.error("❌ Delete note error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};