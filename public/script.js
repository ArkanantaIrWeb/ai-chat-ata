// Grab elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const resetBtn = document.getElementById('reset-btn');

// --- ELEMEN MODAL BARU ---
const modal = document.getElementById('custom-modal');
const btnCancel = document.getElementById('btn-cancel');
const btnConfirm = document.getElementById('btn-confirm');

// --- PERUBAHAN BESAR 1: "INGATAN" DARI LOCALSTORAGE ---
// Kita cek "notes" (localStorage).
// Kalo ada, kita 'parse' (ubah dari teks jadi array).
// Kalo nggak ada, kita mulai dari array kosong [].
let chatHistory = JSON.parse(localStorage.getItem('ata-chat-history')) || [];

// Utility: create an element with optional classes
function el(tag, classes = []) {
    const e = document.createElement(tag);
    classes.forEach(c => e.classList.add(c));
    return e;
}

// "Jaring Pengaman" Sederhana (Level 1 Penerjemah)
function simpleFormat(text) {
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<i>$1</i>');
    formattedText = formattedText.replace(/\n/g, '<br>');
    return formattedText;
}

// Fungsi utama nampilin pesan (DENGAN SMART SCROLL)
function appendMessageText(text, sender = 'bot') {
    const wrapper = el('div', ['message', `${sender}-message`]);
    const meta = el('div', ['meta']);

    const avatar = el('div', ['avatar']);
    avatar.textContent = sender === 'user' ? 'You' : 'AI';

    const info = el('div', ['info']);

    // Render Markdown/Text
    if (sender === "user") {
        info.textContent = text;
    } else {
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            info.innerHTML = DOMPurify.sanitize(marked.parse(text));
        } else {
            console.warn("Marked.js/DOMPurify gagal load. Pake fallback simpleFormat.");
            info.innerHTML = simpleFormat(text);
        }
    }

    meta.appendChild(avatar);
    meta.appendChild(info);

    wrapper.appendChild(meta);
    chatMessages.appendChild(wrapper);

    // --- LOGIKA SMART SCROLL (INI PERBAIKANNYA) ---
    if (sender === 'user') {
        // Kalau User kirim, scroll mentok bawah (biar liat chat sendiri)
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } else {
        // Kalau Bot bales:
        // Cek dulu, chatnya panjang gak?
        // Kita pake scrollIntoView ke AWAL pesan (block: "start")
        // Supaya mata user langsung liat paragraf pertama, bukan paragraf terakhir
        wrapper.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

// Fungsi nampilin 3 titik "typing"
function showTypingIndicator() {
    if (document.getElementById('typing-indicator')) return;

    const wrap = el('div', ['message', 'bot-message']);
    wrap.id = 'typing-indicator';

    // Kita cuma butuh wrapper kosong buat struktur, 
    // karena stylingnya udah kita pindah ke .typing-indicator di CSS
    // TAPI kita tetep butuh Avatar biar rapi
    const meta = el('div', ['meta']);
    const avatar = el('div', ['avatar']);
    avatar.textContent = 'AI';

    // Ini elemen utamanya
    const indicator = el('div', ['typing-indicator']);
    indicator.innerHTML = '<span></span><span></span><span></span>';

    // Masukin ke layar (tanpa .info, langsung .typing-indicator)
    meta.appendChild(avatar);
    meta.appendChild(indicator); // <--- Perhatikan ini

    wrap.appendChild(meta);
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fungsi ngilangin 3 titik "typing"
function hideTypingIndicator() {
    const elIndicator = document.getElementById('typing-indicator');
    if (elIndicator) elIndicator.remove();
}

// --- FUNGSI BARU UNTUK "NYIMPEN KE NOTES" ---
function saveHistory() {
    // 'JSON.stringify' ngubah array kita jadi Teks String
    localStorage.setItem('ata-chat-history', JSON.stringify(chatHistory));
}

// --- FUNGSI BARU UNTUK "NAMPILIN DARI NOTES" ---
function loadHistory() {
    // Loop semua 'ingatan' yang udah di-load
    chatHistory.forEach(message => {
        // Tampilkan ulang ke layar
        appendMessageText(message.content, message.role);
    });
}

// "Pendengar" tombol Kirim (DI-UPGRADE)
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // 1. Tampilkan & Simpan pesan User
    appendMessageText(message, 'user');
    chatHistory.push({
        role: 'user',
        content: message
    });
    // --- TAMBAHAN: SAVE KE "NOTES" ---
    saveHistory();

    userInput.value = '';
    userInput.focus();
    showTypingIndicator();

    try {
        // 2. "Telpon" Backend
        const resp = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: chatHistory
            })
        });

        hideTypingIndicator();
        if (!resp.ok) throw new Error('Server error');

        const data = await resp.json();

        // 3. Tampilkan & Simpan balasan AI
        appendMessageText(data.reply, 'bot');
        chatHistory.push({
            role: 'assistant',
            content: data.reply
        });
        // --- TAMBAHAN: SAVE KE "NOTES" ---
        saveHistory();

    } catch (err) {
        hideTypingIndicator();
        console.error(err);
        appendMessageText('Maaf, terjadi kesalahan saat menghubungi server.', 'bot');
    }
});

// --- LOGIKA MODAL RESET (BARU & KEREN) ---

// 1. Pas tombol Sampah diklik -> Buka Modal
resetBtn.addEventListener('click', () => {
    modal.classList.add('show'); // Tambah class biar muncul animasi
});

// 2. Pas tombol "Batal" diklik -> Tutup Modal
btnCancel.addEventListener('click', () => {
    modal.classList.remove('show');
});

// 3. Pas tombol "Ya, Hapus" diklik -> Hapus Data & Tutup
btnConfirm.addEventListener('click', () => {
    // Aksi Reset (Sama kayak dulu)
    localStorage.removeItem('ata-chat-history');
    chatHistory = [];
    chatMessages.innerHTML = '';

    // Sapa Ulang
    const welcomeMessage = "Halo! Aku **Ata AI**, asisten AI yang dibuat oleh **Arkananta**. Ada yang bisa aku bantu?";
    appendMessageText(welcomeMessage, 'bot');

    // Tutup Modal
    modal.classList.remove('show');
});

// 4. (Opsional) Tutup modal kalo klik di area gelap (luar kotak)
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
    }
});

// --- PERUBAHAN BESAR 2: "SAPAAN" SAAT BUKA ---
window.addEventListener('load', () => {
    // 1. Tampilkan "ingatan" lama DULU
    loadHistory();

    // 2. Cek, ini pengguna baru (history-nya kosong) atau bukan?
    if (chatHistory.length === 0) {
        // Kalo pengguna baru, sapa dia
        setTimeout(() => {
            const welcomeMessage = "Halo! Aku **Ata AI**, asisten AI yang dibuat oleh **Arkananta**. Ada yang bisa aku bantu?";
            appendMessageText(welcomeMessage, 'bot');
            // Kita NGGAK save sapaan ini ke history, biar nggak diulang-ulang
        }, 100);
    }
});