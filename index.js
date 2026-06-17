const { Client, GatewayIntentBits } = require('discord.js');
// SỬA: Tên class đúng là GoogleGenerativeAI
const { GoogleGenerativeAI } = require('@google/generative-ai');
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

// --- 2. CẤU HÌNH GEMINI AI ---
// SỬA: Dùng GoogleGenerativeAI và getGenerativeModel đúng cách
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
    if (!question) return message.reply("Bạn muốn hỏi tôi điều gì nào?");

    try {
        await message.channel.sendTyping();

        const result = await model.generateContent(question);
        const responseText = result.response.text();

        if (responseText.length > 2000) {
            await message.reply(responseText.substring(0, 1990) + "...");
        } else {
            await message.reply(responseText);
        }
    } catch (error) {
        console.error("Lỗi hệ thống:", error);
        await message.reply("Hình như có lỗi kết nối với AI rồi, thử lại sau nhé!");
    }
});

client.login(process.env.DISCORD_TOKEN);