import axios from 'axios';
import { ADMIN_WHATSAPP_NUMBER, META_WHATSAPP_ACCESS_TOKEN, META_WHATSAPP_PHONE_NUMBER_ID } from '../secrets';

// WhatsApp messaging function using Meta API
export const sendWhatsAppMessage = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    // Use the latest API version
    const META_API_VERSION = 'v22.0'; 
    const PHONE_NUMBER_ID = META_WHATSAPP_PHONE_NUMBER_ID;
    const ACCESS_TOKEN = META_WHATSAPP_ACCESS_TOKEN;
    
    // Correct URL format with phone number ID (not the token)
    const url = `https://graph.facebook.com/${META_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    };
    
    // The token goes only in the Authorization header
    const response = await axios.post(url, data, {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('WhatsApp message sent successfully:', response.data);
    return true;
  } catch (error) {
    // Better error handling with specific error information
    if (axios.isAxiosError(error) && error.response) {
      console.error('WhatsApp API error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else {
      console.error('Error sending WhatsApp message:', error);
    }
    return false;
  }
};

// Function to notify admin about new orders
export const notifyAdminAboutOrder = async (order: any): Promise<void> => {
  try {
    const adminPhoneNumber = ADMIN_WHATSAPP_NUMBER;
    
    if (!adminPhoneNumber) {
      console.error('Admin WhatsApp number not configured');
      return;
    }
    
    // Ensure phone number is in international format (with country code)
    const formattedPhoneNumber = adminPhoneNumber.startsWith('+') 
      ? adminPhoneNumber.substring(1) // Remove '+' if present
      : adminPhoneNumber;
    
    const message = `New Order Placed!\n\nOrder ID: ${order.id}\nTotal Amount: ${order.netAmount}\nStatus: ${order.status}\nBranch ID: ${order.branchId}`;
    
    // Send the WhatsApp message to admin
    await sendWhatsAppMessage(formattedPhoneNumber, message);
  } catch (error) {
    console.error('Error notifying admin about order:', error);
  }
};