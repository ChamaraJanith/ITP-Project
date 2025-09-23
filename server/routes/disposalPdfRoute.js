// routes/disposalPdfRoute.js
import express from 'express';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import DisposalRecord from '../model/DisposalRecord.js';

const router = express.Router();

router.get('/disposal-history/pdf', async (req, res) => {
  try {
    // Fetch all disposal records
    const records = await DisposalRecord.find().sort({ disposedDate: -1 });

    // Create PDF document
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const width = doc.internal.pageSize.getWidth();
    let y = 15;

    // Header
    doc.setFontSize(16).setFont('helvetica', 'bold');
    doc.text('HealX Disposal History', width / 2, y, { align: 'center' });
    y += 10;

    // Table data
    const tableBody = records.map((r, i) => [
      String(i + 1),
      r.itemName,
      r.category || '-',
      String(r.quantityDisposed),
      new Date(r.disposedDate).toLocaleDateString(),
      r.disposedBy
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#','Item','Category','Qty','Date','By']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [40, 116, 166], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 }
    });

    // Set response headers
    const filename = `disposal-history-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send PDF buffer
    const pdfBuffer = doc.output('arraybuffer');
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
});

export default router;
