const axios = require('axios');
require('dotenv').config();

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Use the current stable Graph API version
const GRAPH_API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

/**
 * Sends a text message to a WhatsApp user.
 */
async function sendTextMessage(to, text) {
    try {
        await axios({
            method: 'POST',
            url: `${BASE_URL}/${PHONE_NUMBER_ID}/messages`,
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
            },
            data: {
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text }
            }
        });
        console.log(`Message sent to ${to}`);
    } catch (error) {
        console.error("WhatsApp Send Message Error:", error.response ? error.response.data : error.message);
    }
}

/**
 * Downloads media (like a voice note) from WhatsApp servers.
 * Returns an object with { mime_type, buffer }
 */
async function downloadMedia(mediaId) {
    try {
        // 1. Get the media URL from the media ID
        const mediaMetaRes = await axios({
            method: 'GET',
            url: `${BASE_URL}/${mediaId}`,
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`
            }
        });

        const mediaUrl = mediaMetaRes.data.url;
        const mimeType = mediaMetaRes.data.mime_type;

        // 2. Download the actual media file
        const mediaRes = await axios({
            method: 'GET',
            url: mediaUrl,
            headers: {
                'Authorization': `Bearer ${WHATSAPP_TOKEN}`
            },
            responseType: 'arraybuffer' // Get as a buffer
        });

        return {
            mime_type: mimeType,
            buffer: mediaRes.data
        };
    } catch (error) {
        console.error("WhatsApp Download Media Error:", error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    sendTextMessage,
    downloadMedia
};
