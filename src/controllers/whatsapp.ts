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
    const ADMIN_NUMBER = ADMIN_WHATSAPP_NUMBER;
    // Correct URL format with phone number ID (not the token)
    const url = `https://graph.facebook.com/${META_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
    
    const data = {
      messaging_product: 'whatsapp',
      to: ADMIN_NUMBER,
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

export const notifyAdminAboutStockRequest = async (stockRequest: any): Promise<void> => {
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
    
      const message = `📦 *New Stock Request Placed!*

      🆔 *Request ID:* ${stockRequest.id}
      🏬 *Branch:* ${stockRequest.branch.name}
      👤 *Requested By:* ${stockRequest.createdBy.name} (${stockRequest.createdBy.email})
      📝 *Note:* ${stockRequest.note || 'N/A'}
      📅 *Status:* ${stockRequest.status}
      
      🛒 *Items Requested:*
      ${stockRequest.items
        .map(
          (item, index) =>
            `${index + 1}. ${item.product.name} - Qty: ${item.requestedQuantity}`
        )
        .join('\n')}
      
      Please review the request in the system.`;
      
    // Send the WhatsApp message to admin
    await sendWhatsAppMessage(formattedPhoneNumber, message);
  } catch (error) {
    console.error('Error notifying admin about order:', error);
  }
};