import cron from 'node-cron';
import autoRestockService from './autoRestockService.js';

class RestockScheduler {
  constructor() {
    this.isScheduled = false;
    this.job = null;
  }

  // ✅ Start scheduled auto-restock checks
  start() {
    if (this.isScheduled) {
      console.log('⚠️ Restock scheduler already running');
      return;
    }

    try {
      // ✅ CHANGED: Run every 1 minute (instead of 30 minutes)
      this.job = cron.schedule('*/1 * * * *', async () => {
        console.log('⏰ 30-Minute Auto-Restock Check Starting...', new Date().toLocaleTimeString());
        try {
          const result = await autoRestockService.checkAndRestockItems();
          if (result.itemsProcessed > 0) {
            console.log(`✅ Auto-restock completed: ${result.itemsProcessed} items processed`);
            console.log(`📧 Supplier emails sent for ${result.itemsProcessed} items`);
          } else {
            console.log('ℹ️ No items need restocking at this time');
          }
        } catch (error) {
          console.error('❌ Auto-restock failed:', error);
        }
      }, {
        scheduled: false
      });

      this.job.start();
      this.isScheduled = true;
      console.log('✅ Auto-restock scheduler started (EVERY 30 MINUTE) 🚀');
      
    } catch (error) {
      console.error('❌ Failed to start restock scheduler:', error);
      this.isScheduled = false;
    }
  }

  stop() {
    if (this.job) {
      this.job.stop();
      this.job = null;
    }
    this.isScheduled = false;
    console.log('⏹️ Auto-restock scheduler stopped');
  }

  getStatus() {
    return {
      isRunning: this.isScheduled,
      schedule: 'Every 30 minute',
      nextRun: this.job ? this.job.nextDates().toString() : null
    };
  }
}

export default new RestockScheduler();
