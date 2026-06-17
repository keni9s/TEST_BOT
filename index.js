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
    if (!question) return message.reply("Bạn muốn hỏi tôi điều gì nào?");

    try {
        await message.channel.sendTyping();

        const result = await groq.chat.completions.create({
            messages: [{ role: 'user', content: question }],
            model: 'llama-3.3-70b-versatile',
        });
        const responseText = result.choices[0].message.content;

        if (responseText.length > 2000) {
            await message.reply(responseText.substring(0, 1990) + "...");
        } else {
            await message.reply(responseText);
        }
    } catch (error) {
        console.error("Lỗi hệ thống:", error);
        if (error.status === 429) {
            await message.reply("⏳ Bot đang bị giới hạn requests, thử lại sau nhé!");
        } else {
            await message.reply("❌ Có lỗi kết nối với AI, thử lại sau nhé!");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);