import UserModel from '../model/userModel.js';
import transporter from '../config/nodemailer.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

/**
 * Subscribe user - Send confirmation email
 */
export const subscribeUser = async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    let user = await UserModel.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    // Check if already subscribed
    if (user.isSubscribed) {
      return res.status(400).json({
        success: false,
        message: 'You are already subscribed to our newsletter!'
      });
    }

    // Generate subscription confirmation token
    const subscriptionToken = jwt.sign(
      { userId: user._id, email: user.email, action: 'subscribe' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store temporary subscription token
    user.subscriptionToken = subscriptionToken;
    user.subscriptionTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send subscription confirmation email
    const confirmationUrl = `${process.env.FRONTEND_URL}/confirm-subscription?token=${subscriptionToken}`;
    
    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: 'Confirm Your Newsletter Subscription - HealX Healthcare',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #667eea; margin: 0;">HealX Healthcare</h1>
            <p style="color: #666; font-size: 16px;">Your Health, Our Priority</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; color: white; text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 15px 0;">📧 Confirm Your Subscription</h2>
            <p style="margin: 0; font-size: 18px; opacity: 0.9;">Stay updated with the latest health tips and news!</p>
          </div>
          
          <div style="background: #f8f9ff; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
            <h3 style="color: #333; margin-top: 0;">Hi ${user.name}!</h3>
            <p style="color: #555; line-height: 1.6;">
              Thank you for your interest in subscribing to our newsletter. You'll receive:
            </p>
            <ul style="color: #555; line-height: 1.8;">
              <li>🏥 Latest healthcare news and updates</li>
              <li>💡 Health tips and wellness advice</li>
              <li>🎯 Personalized health recommendations</li>
              <li>📅 Appointment reminders and health checkups</li>
              <li>🔬 Medical research insights</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              ✅ Confirm Subscription
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⏰ This confirmation link expires in 24 hours.</strong><br>
              If you didn't request this subscription, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #667eea; font-weight: bold;">Best regards,<br>HealX Healthcare Team</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Subscription confirmation email sent to:', user.email);

    res.status(200).json({
      success: true,
      message: 'Subscription confirmation email sent! Please check your inbox.',
      data: {
        email: user.email,
        expiresIn: '24 hours'
      }
    });

  } catch (error) {
    console.error('❌ Subscribe user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process subscription. Please try again.'
    });
  }
};

/**
 * Confirm subscription from email link
 */
export const confirmSubscription = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Subscription token is required'
      });
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired confirmation link'
      });
    }

    if (decoded.action !== 'subscribe') {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription token'
      });
    }

    // Find user and confirm subscription
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if token matches and hasn't expired
    if (user.subscriptionToken !== token) {
      return res.status(400).json({
        success: false,
        message: 'Invalid confirmation token'
      });
    }

    if (user.subscriptionTokenExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation link has expired. Please request a new one.'
      });
    }

    // Activate subscription
    user.isSubscribed = true;
    user.subscribedAt = new Date();
    user.subscriptionToken = '';
    user.subscriptionTokenExpiry = 0;
    await user.save();

    console.log('✅ User subscription confirmed:', user.email);

    res.status(200).json({
      success: true,
      message: 'Subscription confirmed successfully! Welcome to HealX Healthcare.',
      data: {
        isSubscribed: true,
        subscribedAt: user.subscribedAt
      }
    });

  } catch (error) {
    console.error('❌ Confirm subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm subscription. Please try again.'
    });
  }
};

/**
 * Unsubscribe user
 */
export const unsubscribeUser = async (req, res) => {
  try {
    const { email } = req.body;
    const userID = req.user?.id;

    let user;
    if (userID) {
      user = await UserModel.findById(userID);
    } else if (email) {
      user = await UserModel.findOne({ email: email.toLowerCase() });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isSubscribed) {
      return res.status(400).json({
        success: false,
        message: 'You are not currently subscribed'
      });
    }

    // Unsubscribe user
    user.isSubscribed = false;
    user.unsubscribedAt = new Date();
    await user.save();

    console.log('✅ User unsubscribed:', user.email);

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      data: {
        isSubscribed: false,
        unsubscribedAt: user.unsubscribedAt
      }
    });

  } catch (error) {
    console.error('❌ Unsubscribe user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe. Please try again.'
    });
  }
};

/**
 * Get subscription status
 */
export const getSubscriptionStatus = async (req, res) => {
  try {
    const userID = req.user.id;
    const user = await UserModel.findById(userID);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isSubscribed: user.isSubscribed || false,
        subscribedAt: user.subscribedAt || null,
        unsubscribedAt: user.unsubscribedAt || null
      }
    });

  } catch (error) {
    console.error('❌ Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription status'
    });
  }
};
