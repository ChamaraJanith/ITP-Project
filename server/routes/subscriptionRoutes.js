import express from 'express';
import {
  subscribeUser,
  confirmSubscription,
  unsubscribeUser,
  getSubscriptionStatus
} from '../controller/subscriptionController.js';
import userAuth from '../middleware/userAuth.js';

const subscriptionRouter = express.Router();

// Public routes
subscriptionRouter.post('/subscribe', subscribeUser);
subscriptionRouter.get('/confirm', confirmSubscription);

// Protected routes
subscriptionRouter.post('/unsubscribe', userAuth, unsubscribeUser);
subscriptionRouter.get('/status', userAuth, getSubscriptionStatus);

export default subscriptionRouter;
