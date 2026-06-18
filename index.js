const { Client, GatewayIntentBits } = require('discord.js');
const Groq = require('groq-sdk');
const express = require('express');
require('dotenv').config();

// --- 1. WEB SERVER ẢO ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot Discord của bạn vẫn đang hoạt động trực tuyến 24/7!');
});

app.listen(PORT, () => {
    console.log(`Web server ảo đang chạy trên cổng ${PORT}`);
});

// --- 2. CẤU HÌNH GROQ AI ---
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- 3. DISCORD BOT ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Bot đã online với tên: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.mentions.has(client.user)) return;

    const question = message.content.replace(`<@${client.user.id}>`, '').trim();
    if (!question) return message.reply("What do you want to ask me?");

    try {
        await message.channel.sendTyping();

        const result = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are Vance. You MUST detect the language of the user\'s message and reply in THAT EXACT SAME LANGUAGE. Never switch languages. Keep your answer extremely short and concise, strictly within 2 lines.'
                },
                { role: 'user', content: question }
            ],
            model: 'llama-3.3-70b-versatile',
        });

        let responseText = result.choices[0].message.content;

        const lines = responseText.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 2) {
            responseText = lines.slice(0, 2).join('\n');
        }

        if (responseText.length > 2000) {
            await message.reply(responseText.substring(0, 1990) + "...");
        } else {
            await message.reply(responseText);
        }
    } catch (error) {
        console.error("Lỗi hệ thống:", error);
        if (error.status === 429) {
            await message.reply("⏳ Rate limited, please try again later!");
        } else {
            await message.reply("❌ AI connection error, please try again!");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);