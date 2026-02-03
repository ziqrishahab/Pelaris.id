// EmailJS Configuration
// Get your credentials from: https://dashboard.emailjs.com/

export const EMAILJS_CONFIG = {
  // Your EmailJS Service ID (from Email Services tab)
  SERVICE_ID: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID',
  
  // Your EmailJS Template ID (from Email Templates tab)
  TEMPLATE_ID: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID',
  
  // Your EmailJS Public Key (from Account > API Keys)
  PUBLIC_KEY: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY',
};

// Template variables that will be sent to EmailJS
// Make sure your EmailJS template uses these variable names:
// - {{from_name}} - Sender's name
// - {{from_email}} - Sender's email
// - {{subject}} - Email subject
// - {{message}} - Email message content
// - {{to_name}} - Recipient name (optional, e.g., "Pelaris Support")
