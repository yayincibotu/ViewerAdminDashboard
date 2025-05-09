/**
 * Mail Service - Mailjet Integration
 * Provides functionality for sending verification emails and other system notifications.
 */

import Mailjet from "node-mailjet";
import { log } from "./vite";

// Validate required environment variables for Mailjet
if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
  console.error("MAILJET_API_KEY and MAILJET_SECRET_KEY environment variables must be set for email functionality");
}

// Initialize Mailjet client
const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY as string,
  apiSecret: process.env.MAILJET_SECRET_KEY as string,
});

// Define email templates
const EMAIL_TEMPLATES = {
  VERIFICATION: {
    subject: "Verify Your Statilize Account",
    textPart: (verificationLink: string) => 
      `Welcome to Statilize!\n\n` +
      `Please verify your email address by clicking the link below:\n` +
      `${verificationLink}\n\n` +
      `This link will expire in 24 hours.\n\n` +
      `If you did not create an account with Statilize, please ignore this email.\n\n` +
      `The Statilize Team`,
    htmlPart: (verificationLink: string) => 
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #3b82f6, #2563eb); padding: 20px; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">Welcome to Statilize</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 5px 5px;">
          <p style="font-size: 16px; line-height: 24px; color: #374151;">Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background: linear-gradient(to right, #3b82f6, #2563eb); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="font-size: 14px; line-height: 24px; color: #6b7280;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 14px; line-height: 24px; color: #3b82f6; word-break: break-all;">${verificationLink}</p>
          <p style="font-size: 14px; line-height: 24px; color: #6b7280; margin-top: 30px;">This link will expire in 24 hours.</p>
          <p style="font-size: 14px; line-height: 24px; color: #6b7280;">If you did not create an account with Statilize, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} Statilize. All rights reserved.</p>
        </div>
      </div>`
  },
  WELCOME: {
    subject: "Welcome to Statilize!",
    textPart: (username: string) => 
      `Hi ${username},\n\n` +
      `Thank you for joining Statilize! We're excited to have you onboard.\n\n` +
      `You can now access your dashboard to start using Statilize's powerful tools.\n\n` +
      `If you have any questions, feel free to contact our support team.\n\n` +
      `Best regards,\n` +
      `The Statilize Team`,
    htmlPart: (username: string) => 
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(to right, #3b82f6, #2563eb); padding: 20px; border-radius: 5px 5px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">Welcome to Statilize</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 5px 5px;">
          <p style="font-size: 16px; line-height: 24px; color: #374151;">Hi ${username},</p>
          <p style="font-size: 16px; line-height: 24px; color: #374151;">Thank you for joining Statilize! We're excited to have you onboard.</p>
          <p style="font-size: 16px; line-height: 24px; color: #374151;">You can now access your dashboard to start using Statilize's powerful tools.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://statilize.com/app" style="background: linear-gradient(to right, #3b82f6, #2563eb); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
          </div>
          <p style="font-size: 16px; line-height: 24px; color: #374151;">If you have any questions, feel free to contact our support team.</p>
          <p style="font-size: 16px; line-height: 24px; color: #374151; margin-top: 30px;">Best regards,<br>The Statilize Team</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">© ${new Date().getFullYear()} Statilize. All rights reserved.</p>
        </div>
      </div>`
  }
};

/**
 * Mail service interface
 */
export interface MailService {
  sendVerificationEmail(to: string, username: string, verificationToken: string): Promise<boolean>;
  sendWelcomeEmail(to: string, username: string): Promise<boolean>;
  // Add more mail methods as needed
}

/**
 * Mailjet implementation of the mail service
 */
export class MailjetService implements MailService {
  private readonly sender = {
    email: "hello@statilize.com",
    name: "Statilize"
  };
  
  /**
   * Sends a verification email with a token link
   * @param to - Recipient email address
   * @param username - Recipient username
   * @param verificationToken - The verification token
   * @returns Promise resolving to boolean success status
   */
  async sendVerificationEmail(to: string, username: string, verificationToken: string): Promise<boolean> {
    try {
      // Generate verification link
      const baseUrl = process.env.BASE_URL || "http://localhost:5000";
      const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;
      
      // Debug - remove in production
      log(`Sending verification email to ${to} with verification link: ${verificationLink}`, "mail");
      
      const response = await mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: this.sender,
            To: [{ Email: to, Name: username }],
            Subject: EMAIL_TEMPLATES.VERIFICATION.subject,
            TextPart: EMAIL_TEMPLATES.VERIFICATION.textPart(verificationLink),
            HTMLPart: EMAIL_TEMPLATES.VERIFICATION.htmlPart(verificationLink),
          }
        ]
      });
      
      return true; // If we got here, the email was sent successfully
    } catch (error) {
      console.error("Error sending verification email:", error);
      return false;
    }
  }
  
  /**
   * Sends a welcome email after account verification
   * @param to - Recipient email address
   * @param username - Recipient username
   * @returns Promise resolving to boolean success status
   */
  async sendWelcomeEmail(to: string, username: string): Promise<boolean> {
    try {
      const response = await mailjet.post('send', { version: 'v3.1' }).request({
        Messages: [
          {
            From: this.sender,
            To: [{ Email: to, Name: username }],
            Subject: EMAIL_TEMPLATES.WELCOME.subject,
            TextPart: EMAIL_TEMPLATES.WELCOME.textPart(username),
            HTMLPart: EMAIL_TEMPLATES.WELCOME.htmlPart(username),
          }
        ]
      });
      
      return true; // If we got here, the email was sent successfully
    } catch (error) {
      console.error("Error sending welcome email:", error);
      return false;
    }
  }
}

// Export a singleton instance of the mail service
export const mailService = new MailjetService();