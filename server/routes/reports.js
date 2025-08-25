// import express from 'express';
// import SurgicalItem from '../model/SurgicalItem.js';

// const reportRouter = express.Router();

// /* GET /api/report/surgical */
//   try {
//     const items = await SurgicalItem.find().lean();

//     /* headline KPIs */
//     const totals = items.reduce(
//       (acc, it) => {
//         acc.totalSKUs  += 1;
//         acc.inventoryValue += it.quantity * it.price;
//         if (it.quantity <= it.minStockLevel) acc.lowStock += 1;
//         return acc;
//       },
//       { totalSKUs: 0, inventoryValue: 0, lowStock: 0 }
//     );

//     res.json({ success: true, items, totals });
//   } catch (err) {
//     console.error('Report error:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }


// export default reportRouter;
