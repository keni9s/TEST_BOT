const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
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

// Sự kiện khi bot online - Tích hợp tự động xóa lệnh gạch chéo cũ
client.once('ready', async () => {
    console.log(`Bot đã online với tên: ${client.user.tag}`);

    // Tiến hành xóa toàn bộ lệnh gạch chéo cũ
    try {
        console.log('Đang dọn dẹp các lệnh gạch chéo cũ...');
        const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
        
        await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
        console.log('✅ Đã xóa sạch toàn bộ lệnh gạch chéo thành công!');
    } catch (error) {
        console.error('❌ Lỗi khi dọn dẹp lệnh gạch chéo:', error);
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.mentions.has(client.user)) return;

    const question = message.content.replace(`<@${client.user.id}>`, '').trim();
    if (!question) return message.reply("Bạn muốn hỏi tôi điều gì nào?");

    try {
        await message.channel.sendTyping();

        // Ép AI tuân thủ luật trả lời tối đa 2 dòng bằng system prompt
        const result = await groq.chat.completions.create({
            messages: [
                { 
                    role: 'system', 
                    content: 'Bạn là Vance. Bạn phải luôn trả lời cực kỳ ngắn gọn, súc tích và TUYỆT ĐỐI KHÔNG ĐƯỢC VƯỢT QUÁ 2 DÒNG.' 
                },
                { role: 'user', content: question }
            ],
            model: 'llama-3.3-70b-versatile',
        });
        
        let responseText = result.choices[0].message.content;

        // Cắt bớt phần thừa nếu AI cố tình trả lời dài hơn 2 dòng dựa trên dấu xuống dòng (\n)
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
            await message.reply("⏳ Bot đang bị giới hạn requests, thử lại sau nhé!");
        } else {
            await message.reply("❌ Có lỗi kết nối với AI, thử lại sau nhé!");
        }
    }
});

client.login(process.env.DISCORD_TOKEN);