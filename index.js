const { Client, GatewayIntentBits } = require('discord.js');
// SỬA TẠI ĐÂY: Sử dụng class GoogleGenAI viết đúng chuẩn của thư viện gốc
const { GoogleGenAI } = require('@google/generative-ai');
const express = require('express');
require('dotenv').config();

// --- 1. TẠO WEB SERVER ẢO ĐỂ GIỮ BOT LUÔN THỨC TRÊN RENDER ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot Discord của bạn vẫn đang hoạt động trực tuyến 24/7!');
});

app.listen(PORT, () => {
    console.log(`Web server ảo đang chạy trên cổng ${PORT}`);
});

// --- 2. CẤU HÌNH GEMINI AI ---
// SỬA TẠI ĐÂY: Khởi tạo bằng cách truyền trực tiếp chuỗi API Key, không bọc trong object { apiKey: ... }
const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

// --- 3. CẤU HÌNH DISCORD BOT ---
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
    // Không trả lời tin nhắn của bot khác hoặc của chính nó
    if (message.author.bot) return;
    
    // Chỉ trả lời khi được tag (mention) trong server
    if (!message.mentions.has(client.user)) return;

    // Lọc bỏ phần tag để lấy câu hỏi thực tế
    const question = message.content.replace(`<@${client.user.id}>`, '').trim();
    if (!question) return message.reply("Bạn muốn hỏi tôi điều gì nào?");

    try {
        // Hiển thị trạng thái "đang gõ..." trên Discord
        await message.channel.sendTyping();

        // Gửi câu hỏi sang Gemini và nhận câu trả lời văn bản
        const result = await model.generateContent(question);
        const responseText = result.response.text();

        // Giới hạn ký tự tin nhắn của Discord là 2000
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