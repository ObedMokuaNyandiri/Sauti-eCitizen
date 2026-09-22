const express = require('express');
const { sendTextMessage, downloadMedia } = require('./services/whatsapp');
const { processTextQuery, processAudioQuery } = require('./services/gemini');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

// Webhook Verification (required by Meta/WhatsApp)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.status(400).send('Missing mode or token');
    }
});

// Handle incoming messages
app.post('/webhook', async (req, res) => {
    const body = req.body;

    // Check if it's a WhatsApp API event
    if (body.object === 'whatsapp_business_account') {
        try {
            for (const entry of body.entry) {
                const changes = entry.changes[0].value;
                if (changes.messages && changes.messages.length > 0) {
                    const message = changes.messages[0];
                    const sender = message.from;

                    // Mark message as read (optional but good practice)
                    // ...

                    let botReply = "Pole, I didn't understand that format.";

                    if (message.type === 'text') {
                        const text = message.text.body;
                        console.log(`Received text from ${sender}: ${text}`);
                        botReply = await processTextQuery(text);
                    } else if (message.type === 'audio') {
                        console.log(`Received audio from ${sender}`);
                        const mediaId = message.audio.id;
                        
                        try {
                            // Download audio
                            const media = await downloadMedia(mediaId);
                            // Process with Gemini
                            botReply = await processAudioQuery(media.mime_type, media.buffer);
                        } catch (mediaError) {
                            console.error("Failed to process audio media:", mediaError);
                            botReply = "I received a voice note, but I couldn't download it from WhatsApp right now. Please try again.";
                        }
                    } else {
                        botReply = "Mambo! Currently, I only support text messages and voice notes.";
                    }

                    // Send the reply
                    await sendTextMessage(sender, botReply);
                }
            }
            res.sendStatus(200);
        } catch (error) {
            console.error("Error processing webhook:", error);
            res.sendStatus(500);
        }
    } else {
        // Not a WhatsApp event
        res.sendStatus(404);
    }
});

app.get('/', (req, res) => {
    res.send('Sauti-eCitizen WhatsApp Bot is running!');
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
