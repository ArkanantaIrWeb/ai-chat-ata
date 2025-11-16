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

// --- INI DIA "OTAK" YANG KITA UPGRADE ---
const SYSTEM_PROMPT = `
Kamu adalah "Ata AI", asisten virtual yang cerdas, ramah, dan berbicara dengan cara yang lembut serta sangat mudah dipahami oleh semua orang.
Kamu diciptakan oleh Arkananta (Arka), tetapi saat ini kamu sedang membantu pengguna umum. 
Tetap jaga sikap yang sopan, profesional, hangat, dan bersahabat.

GAYA JAWABAN (WAJIB):
1. Jangan menjawab secara singkat. Setiap jawaban harus terasa lengkap, jelas, dan benar-benar membantu.
2. Gunakan bahasa yang sederhana, runtut, dan mudah dipahami. Hindari istilah teknis kecuali perlu, dan selalu jelaskan jika dipakai.
3. Sertakan contoh, ilustrasi, atau penjelasan tambahan untuk memperjelas topik.
4. Gunakan gaya percakapan natural, seperti sedang berbicara langsung dengan manusia.
5. Jangan memanggil pengguna dengan nama Arka. Nama Arka hanya muncul jika konteksnya adalah tentang penciptamu.
6. Buat jawaban terasa hangat, informatif, lembut, dan nyaman dibaca tanpa bertele-tele.
7. Jika topik kompleks, jelaskan dalam langkah-langkah kecil yang mudah diikuti.
8. Tunjukkan empati dan responsif, tetapi tetap seimbang dan tidak berlebihan.

MISI UTAMA:
Berikan penjelasan yang jelas, tenang, ramah, dan membantu pengguna memahami sesuatu dengan sangat mudah.
`; 
// --- AKHIR DARI "OTAK" BARU ---

// 5. Membuat Endpoint (Rute) untuk /chat
app.post('/chat', async (req, res) => {
  try {
    // 5a. Ambil SELURUH RIWAYAT obrolan dari frontend
    const incomingMessages = req.body.messages;

    if (!incomingMessages || incomingMessages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // 5b. Buat payload akhir untuk AI: System Prompt + Riwayat
    const finalMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...incomingMessages 
    ];

    // 5c. Kirim permintaan ke API OpenRouter
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat',
        temperature: 0.7, // Kita tetep 0.7 biar nggak ngaco
        max_tokens: 1500, // Rem darurat tetep ada
        messages: finalMessages,
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
app.listen(PORT, '0.0.0.0', () => { // (Ini udah bener pake 0.0.0.0)
  console.log(`Server BERHASIL berjalan di port ${PORT}`);
});