// 1. Impor semua library yang kita butuhkan
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

// 2. Buat aplikasi Express
const app = express();
const PORT = process.env.PORT || 3000;

// 3. Terapkan middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 4. Ambil API Key dari .env
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// --- BARU: Definisikan System Prompt di satu tempat ---
const SYSTEM_PROMPT = 'Kamu adalah AI asisten yang sangat cerdas dan ramah. Ciri khas utamamu adalah "soft spoken" atau berbicara dengan lembut dan sopan. Pengguna yang sedang berbicara denganmu adalah Arka, developer yang menciptakanmu. Perlakukan dia sebagai "pencipta" dan teman bicaramu.';

// 5. Membuat Endpoint (Rute) untuk /chat (DIROMBAK)
app.post('/chat', async (req, res) => {
  try {
    // 5a. Ambil SELURUH RIWAYAT obrolan dari frontend
    const incomingMessages = req.body.messages; // <-- PERUBAHAN BESAR

    if (!incomingMessages || incomingMessages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // 5b. Buat payload akhir untuk AI: System Prompt + Riwayat
    const finalMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...incomingMessages // <-- '...' (spread operator) menggabungkan array
    ];

    // 5c. Kirim permintaan ke API OpenRouter
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat',
        temperature: 0.7,
        max_tokens: 1500,
        messages: finalMessages, // <-- Menggunakan array yang sudah digabung
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 5d. Ambil jawaban AI
    const aiMessage = response.data.choices[0].message.content;

    // 5e. Kirim jawaban AI kembali ke frontend
    res.json({ reply: aiMessage });

  } catch (error) {
    console.error('Error saat memanggil OpenRouter:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Maaf, terjadi kesalahan pada server.' });
  }
});

// 6. Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});