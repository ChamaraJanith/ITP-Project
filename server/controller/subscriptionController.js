import UserModel from '../model/userModel.js';
import transporter from '../config/nodemailer.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

/**
 * Subscribe user - Send confirmation email with mobile deep linking
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

    // ✅ Enhanced deep linking and mobile detection
    const confirmationUrl = `${process.env.BACKEND_URL}/api/subscription/confirm?token=${subscriptionToken}`;
    
    // Detect mobile user agent
    const userAgent = req.headers['user-agent'] || '';
    const isMobileEmailClient = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    // App deep linking setup
    const appDeepLink = `${process.env.APP_SCHEME || 'healx'}://profile?subscribed=true&token=${subscriptionToken}`;
    const webFallback = confirmationUrl;

    // Smart link that tries app first, then falls back to web
    const smartLink = `https://${process.env.APP_LINK_DOMAIN || 'healx.app.link'}/confirm?token=${subscriptionToken}&fallback=${encodeURIComponent(webFallback)}`;

    // Choose which link to use in the email
    const emailConfirmationLink = isMobileEmailClient ? smartLink : confirmationUrl;

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
          
          <!-- Enhanced mobile-friendly confirmation button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${emailConfirmationLink}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white !important; 
                      padding: 18px 35px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold; 
                      font-size: 18px;
                      display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
                      min-width: 200px;
                      -webkit-text-size-adjust: none;"
               target="_blank">
              ✅ Confirm Subscription
            </a>
          </div>
          
          <!-- Mobile fallback links -->
          <div style="background: #e3f2fd; border: 1px solid #bbdefb; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #1565c0; font-size: 14px;">
              <strong>📱 Having trouble with the button?</strong><br>
              Try these options:
            </p>
            <div style="margin: 10px 0;">
              <a href="${confirmationUrl}" style="color: #667eea; text-decoration: none; display: inline-block; margin: 5px; padding: 8px 15px; background: white; border-radius: 5px;">🌐 Open in Browser</a>
              ${isMobileEmailClient ? `<a href="${appDeepLink}" style="color: #667eea; text-decoration: none; display: inline-block; margin: 5px; padding: 8px 15px; background: white; border-radius: 5px;">📱 Open in App</a>` : ''}
            </div>
            <p style="margin: 5px 0; color: #1565c0; font-size: 12px;">
              Or copy this link:<br>
              <span style="word-break: break-all; font-family: monospace; background: white; padding: 5px; border-radius: 4px; display: inline-block; margin-top: 5px; font-size: 11px;">
                ${confirmationUrl}
              </span>
            </p>
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
        expiresIn: '24 hours',
        isMobile: isMobileEmailClient
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
 * Confirm subscription from email link - Enhanced for mobile
 */
export const confirmSubscription = async (req, res) => {
  try {
    const { token } = req.query;
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    if (!token) {
      if (isMobile) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Subscription Error</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
                .error-box { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; margin: 2rem auto; max-width: 400px; }
                .btn { background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; }
              </style>
            </head>
            <body>
              <div class="error-box">
                <h1>❌ Invalid Link</h1>
                <p>Missing confirmation token</p>
                <a href="${process.env.FRONTEND_URL}/profile" class="btn">Go to Profile</a>
              </div>
              <script>
                setTimeout(() => {
                  window.location.href = '${process.env.FRONTEND_URL}/profile?subscription_error=true&error=missing_token';
                }, 3000);
              </script>
            </body>
          </html>
        `);
      }
      const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=missing_token`;
      return res.redirect(errorUrl);
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('Token verification failed:', error.message);
      if (isMobile) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Subscription Error</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
                .error-box { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; margin: 2rem auto; max-width: 400px; }
                .btn { background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; }
              </style>
            </head>
            <body>
              <div class="error-box">
                <h1>⏰ Link Expired</h1>
                <p>This confirmation link has expired or is invalid</p>
                <a href="${process.env.FRONTEND_URL}/subscription" class="btn">Subscribe Again</a>
                <a href="${process.env.FRONTEND_URL}/profile" class="btn">Profile</a>
              </div>
              <script>
                setTimeout(() => {
                  window.location.href = '${process.env.FRONTEND_URL}/profile?subscription_error=true&error=invalid_token';
                }, 4000);
              </script>
            </body>
          </html>
        `);
      }
      const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=invalid_token`;
      return res.redirect(errorUrl);
    }

    if (decoded.action !== 'subscribe') {
      if (isMobile) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Subscription Error</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
                .error-box { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; margin: 2rem auto; max-width: 400px; }
                .btn { background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; }
              </style>
            </head>
            <body>
              <div class="error-box">
                <h1>❌ Invalid Action</h1>
                <p>This link is not for subscription confirmation</p>
                <a href="${process.env.FRONTEND_URL}/profile" class="btn">Go to Profile</a>
              </div>
              <script>
                setTimeout(() => {
                  window.location.href = '${process.env.FRONTEND_URL}/profile?subscription_error=true&error=invalid_action';
                }, 3000);
              </script>
            </body>
          </html>
        `);
      }
      const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=invalid_action`;
      return res.redirect(errorUrl);
    }

    // Find user and confirm subscription
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      if (isMobile) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>User Not Found</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
                .error-box { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; margin: 2rem auto; max-width: 400px; }
                .btn { background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; }
              </style>
            </head>
            <body>
              <div class="error-box">
                <h1>👤 User Not Found</h1>
                <p>We couldn't find your account</p>
                <a href="${process.env.FRONTEND_URL}/register" class="btn">Register</a>
                <a href="${process.env.FRONTEND_URL}/login" class="btn">Login</a>
              </div>
              <script>
                setTimeout(() => {
                  window.location.href = '${process.env.FRONTEND_URL}/profile?subscription_error=true&error=user_not_found';
                }, 4000);
              </script>
            </body>
          </html>
        `);
      }
      const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=user_not_found`;
      return res.redirect(errorUrl);
    }

    // Check if token matches and hasn't expired
    if (user.subscriptionToken !== token) {
      if (isMobile) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Invalid Token</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
                .error-box { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; margin: 2rem auto; max-width: 400px; }
                .btn { background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; }
              </style>
            </head>
            <body>
              <div class="error-box">
                <h1>🔒 Invalid Token</h1>
                <p>This confirmation link is no longer valid</p>
                <a href="${process.env.FRONTEND_URL}/subscription" class="btn">Subscribe Again</a>
              </div>
              <script>
                setTimeout(() => {
                  window.location.href = '${process.env.FRONTEND_URL}/profile?subscription_error=true&error=token_mismatch';
                }, 3000);
              </script>
            </body>
          </html>
        `);
      }
      const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=token_mismatch`;
      return res.redirect(errorUrl);
    }

    if (user.subscriptionTokenExpiry < Date.now()) {
      if (isMobile) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Link Expired</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
                .error-box { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; margin: 2rem auto; max-width: 400px; }
                .btn { background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; }
              </style>
            </head>
            <body>
              <div class="error-box">
                <h1>⏰ Link Expired</h1>
                <p>This confirmation link has expired (24 hours limit)</p>
                <a href="${process.env.FRONTEND_URL}/subscription" class="btn">Get New Link</a>
              </div>
              <script>
                setTimeout(() => {
                  window.location.href = '${process.env.FRONTEND_URL}/profile?subscription_error=true&error=token_expired';
                }, 4000);
              </script>
            </body>
          </html>
        `);
      }
      const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=token_expired`;
      return res.redirect(errorUrl);
    }

    // Check if already subscribed
    if (user.isSubscribed) {
      if (isMobile) {
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Already Subscribed</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
                .success-box { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; margin: 2rem auto; max-width: 400px; }
                .btn { background: #667eea; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; }
              </style>
            </head>
            <body>
              <div class="success-box">
                <h1>✅ Already Subscribed!</h1>
                <p>You're already part of our newsletter community</p>
                <a href="${process.env.FRONTEND_URL}/profile" class="btn">View Profile</a>
              </div>
              <script>
                setTimeout(() => {
                  window.location.href = '${process.env.FRONTEND_URL}/profile?already_subscribed=true';
                }, 3000);
              </script>
            </body>
          </html>
        `);
      }
      const alreadySubscribedUrl = `${process.env.FRONTEND_URL}/profile?already_subscribed=true`;
      return res.redirect(alreadySubscribedUrl);
    }

    // ✅ Activate subscription
    user.isSubscribed = true;
    user.subscribedAt = new Date();
    user.subscriptionToken = '';
    user.subscriptionTokenExpiry = 0;
    await user.save();

    console.log('✅ User subscription confirmed:', user.email);

    // Send welcome email
    try {
      const welcomeMailOptions = {
        from: process.env.SENDER_EMAIL,
        to: user.email,
        subject: 'Welcome to HealX Newsletter! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #667eea; margin: 0;">HealX Healthcare</h1>
            </div>
            
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 15px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 15px 0;">🎉 Welcome to HealX!</h2>
              <p style="margin: 0; font-size: 18px; opacity: 0.9;">You're now part of our healthcare community!</p>
            </div>
            
            <div style="background: #f0fdf4; padding: 25px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #10b981;">
              <h3 style="color: #047857; margin-top: 0;">Hi ${user.name}!</h3>
              <p style="color: #065f46; line-height: 1.6;">
                Your subscription is now active! You'll receive:
              </p>
              <ul style="color: #065f46; line-height: 1.8;">
                <li>📧 Weekly health newsletters</li>
                <li>💡 Exclusive health tips and advice</li>
                <li>🎯 Early access to new features</li>
                <li>🔔 Important health alerts and updates</li>
                <li>👑 Premium subscriber benefits</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/profile" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 20px; 
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                👑 View Your Premium Profile
              </a>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #10b981; font-weight: bold;">Welcome aboard! 🚀<br>HealX Healthcare Team</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(welcomeMailOptions);
      console.log('✅ Welcome email sent to:', user.email);
    } catch (emailError) {
      console.log('⚠️ Welcome email failed (but subscription was successful):', emailError.message);
    }

    // Success redirect with mobile-specific handling
    if (isMobile) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Subscription Confirmed! 🎉</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 2rem; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%); 
                color: white; 
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
              }
              .success-box { 
                background: rgba(255,255,255,0.1); 
                backdrop-filter: blur(15px);
                padding: 3rem; 
                border-radius: 20px; 
                margin: 2rem auto; 
                max-width: 400px; 
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              }
              .btn { 
                background: #10b981; 
                color: white; 
                padding: 15px 30px; 
                border: none; 
                border-radius: 12px; 
                text-decoration: none; 
                display: inline-block; 
                margin: 15px 10px; 
                font-weight: bold;
                font-size: 16px;
                transition: all 0.3s ease;
              }
              .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
              }
              .crown { font-size: 3rem; margin-bottom: 1rem; animation: bounce 2s infinite; }
              @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
              }
            </style>
          </head>
          <body>
            <div class="success-box">
              <div class="crown">👑</div>
              <h1>🎉 Subscription Confirmed!</h1>
              <p>Welcome to HealX Healthcare premium newsletter!</p>
              <p style="font-size: 14px; opacity: 0.9;">You now have subscriber benefits and will receive exclusive health content.</p>
              <a href="${process.env.FRONTEND_URL}/profile?subscribed=true&timestamp=${Date.now()}" class="btn">View Premium Profile</a>
              <a href="${process.env.FRONTEND_URL}/" class="btn" style="background: #667eea;">Back to Home</a>
            </div>
            <script>
              setTimeout(() => {
                window.location.href = '${process.env.FRONTEND_URL}/profile?subscribed=true&timestamp=${Date.now()}';
              }, 5000);
            </script>
          </body>
        </html>
      `);
    }

    // Desktop redirect
    const successUrl = `${process.env.FRONTEND_URL}/profile?subscribed=true&timestamp=${Date.now()}`;
    return res.redirect(successUrl);

  } catch (error) {
    console.error('❌ Confirm subscription error:', error);
    if (isMobile) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Subscription Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
              .error-box { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; margin: 2rem auto; max-width: 400px; }
              .btn { background: #10b981; color: white; padding: 12px 24px; border: none; border-radius: 8px; text-decoration: none; display: inline-block; margin: 10px; }
            </style>
          </head>
          <body>
            <div class="error-box">
              <h1>❌ Something Went Wrong</h1>
              <p>We couldn't process your subscription confirmation</p>
              <a href="${process.env.FRONTEND_URL}/subscription" class="btn">Try Again</a>
              <a href="${process.env.FRONTEND_URL}/profile" class="btn">Profile</a>
            </div>
            <script>
              setTimeout(() => {
                window.location.href = '${process.env.FRONTEND_URL}/profile?subscription_error=true&error=server_error';
              }, 4000);
            </script>
          </body>
        </html>
      `);
    }
    const errorUrl = `${process.env.FRONTEND_URL}/profile?subscription_error=true&error=server_error`;
    return res.redirect(errorUrl);
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
