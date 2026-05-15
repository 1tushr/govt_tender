import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';

const router = express.Router();

// @route   POST /api/notifications/send-email
// @desc    Send email notification
// @access  Private
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        message: 'To, subject, and html are required' 
      });
    }

    // Check email provider configuration
    const provider = process.env.EMAIL_PROVIDER || 'smtp';
    
    let result;
    
    if (provider === 'resend') {
      // Use Resend API
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'GovTender Scout <noreply@govtenderscout.in>',
          to,
          subject,
          html,
        }),
      });
      
      result = await response.json();
    } else {
      // Use SMTP with nodemailer
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      result = await transporter.sendMail({
        from: `"GovTender Scout" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
    }

    res.json({
      success: true,
      message: 'Email sent successfully',
      data: { result },
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email' 
    });
  }
});

// @route   POST /api/notifications/send-whatsapp
// @desc    Send WhatsApp notification
// @access  Private
router.post('/send-whatsapp', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'To and message are required' 
      });
    }

    // Format phone number for WhatsApp
    const formattedNumber = to.startsWith('+') ? to : `+91${to}`;
    const whatsappNumber = `whatsapp:${formattedNumber}`;

    const twilio = await import('twilio');
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: whatsappNumber,
      body: message,
    });

    res.json({
      success: true,
      message: 'WhatsApp message sent successfully',
      data: { sid: result.sid },
    });
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send WhatsApp message' 
    });
  }
});

// @route   POST /api/notifications/bulk-alert
// @desc    Send bulk tender alerts to users
// @access  Private
router.post('/bulk-alert', async (req, res) => {
  try {
    const { tenderIds, notificationType = 'email' } = req.body;

    if (!tenderIds || !Array.isArray(tenderIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid tender IDs array is required' 
      });
    }

    const Tender = (await import('../models/Tender.js')).default;

    // Get tenders
    const tenders = await Tender.find({ _id: { $in: tenderIds } });

    if (tenders.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No tenders found' 
      });
    }

    // Get all users with matching preferences
    const users = await User.find({
      [notificationType === 'email' ? 'preferences.emailNotifications' : 'preferences.whatsappNotifications']: true,
      'subscription.status': 'active',
    });

    let sentCount = 0;

    for (const user of users) {
      // Check if tender matches user profile
      const matchingTenders = tenders.filter(tender => {
        const keywordMatch = user.profile.keywords?.some(keyword => 
          tender.title.toLowerCase().includes(keyword.toLowerCase()) ||
          tender.description.toLowerCase().includes(keyword.toLowerCase())
        );
        
        const stateMatch = !user.profile.states?.length || 
          user.profile.states.includes(tender.location.state);
        
        return keywordMatch || stateMatch;
      });

      if (matchingTenders.length > 0) {
        const subject = `🔔 ${matchingTenders.length} New Tender${matchingTenders.length > 1 ? 's' : ''} Matching Your Profile`;
        
        const html = `
          <h2>New Government Tenders Available</h2>
          <p>Hi ${user.fullName},</p>
          <p>We found ${matchingTenders.length} new tender${matchingTenders.length > 1 ? 's' : ''} that match your criteria:</p>
          <ul>
            ${matchingTenders.map(t => `
              <li>
                <strong>${t.title}</strong><br/>
                Organization: ${t.organization}<br/>
                Deadline: ${new Date(t.dates.endDate).toLocaleDateString('en-IN')}<br/>
                <a href="${process.env.FRONTEND_URL}/tenders/${t._id}">View Details</a>
              </li>
            `).join('')}
          </ul>
          <p>Best regards,<br/>The GovTender Scout Team</p>
          <hr/>
          <p style="font-size: 12px; color: #666;">
            You're receiving this because you enabled ${notificationType} notifications. 
            <a href="${process.env.FRONTEND_URL}/settings">Update preferences</a> | 
            <a href="${process.env.FRONTEND_URL}/unsubscribe?email=${user.email}">Unsubscribe</a>
          </p>
        `;

        try {
          if (notificationType === 'email') {
            await fetch(`${process.env.API_URL || 'http://localhost:5000'}/api/notifications/send-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: user.email,
                subject,
                html,
              }),
            });
          } else {
            const message = `🔔 ${matchingTenders.length} New Tender${matchingTenders.length > 1 ? 's' : ''}!\n\n` +
              matchingTenders.map((t, i) => 
                `${i + 1}. ${t.title}\n   Org: ${t.organization}\n   Deadline: ${new Date(t.dates.endDate).toLocaleDateString('en-IN')}`
              ).join('\n\n') +
              `\n\nView details: ${process.env.FRONTEND_URL}/dashboard`;

            await fetch(`${process.env.API_URL || 'http://localhost:5000'}/api/notifications/send-whatsapp`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: user.mobile,
                message,
              }),
            });
          }
          sentCount++;
        } catch (err) {
          console.error(`Failed to send to ${user.email}:`, err);
        }
      }
    }

    res.json({
      success: true,
      message: `Bulk alerts sent to ${sentCount} users`,
      data: { sentCount, totalUsers: users.length },
    });
  } catch (error) {
    console.error('Bulk alert error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send bulk alerts' 
    });
  }
});

export default router;
