// Grab elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

// --- PERUBAHAN BESAR 1: "INGATAN" DARI LOCALSTORAGE ---
// Kita cek "notes" (localStorage).
// Kalo ada, kita 'parse' (ubah dari teks jadi array).
// Kalo nggak ada, kita mulai dari array kosong [].
let chatHistory = JSON.parse(localStorage.getItem('ata-chat-history')) || [];

// Utility: create an element with optional classes
function el(tag, classes = []){
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

// Fungsi utama nampilin pesan
function appendMessageText(text, sender = 'bot'){
    const wrapper = el('div', ['message', `${sender}-message`]);
    const meta = el('div', ['meta']);
    const avatar = el('div', ['avatar']);
    avatar.textContent = sender === 'user' ? 'You' : 'AI';
    const info = el('div', ['info']);
    
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
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fungsi nampilin 3 titik "typing"
function showTypingIndicator(){
    if (document.getElementById('typing-indicator')) return;
    const wrap = el('div', ['message', 'bot-message']);
    wrap.id = 'typing-indicator';
    const meta = el('div', ['meta']);
    const avatar = el('div', ['avatar']); 
    avatar.textContent = 'AI';
    const indicator = el('div', ['typing-indicator']);
    indicator.innerHTML = '<span></span><span></span><span></span>';
    meta.appendChild(avatar);
    meta.appendChild(indicator);
    wrap.appendChild(meta);
}

// Fungsi ngilangin 3 titik "typing"
function hideTypingIndicator(){
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
chatForm.addEventListener('submit', async (e) =>{
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // 1. Tampilkan & Simpan pesan User
    appendMessageText(message, 'user');
    chatHistory.push({ role: 'user', content: message });
    // --- TAMBAHAN: SAVE KE "NOTES" ---
    saveHistory();

    userInput.value = '';
    userInput.focus();
    showTypingIndicator();

    try{
        // 2. "Telpon" Backend
        const resp = await fetch('/chat', {
            method: 'POST', 
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ messages: chatHistory })
        });
        
        hideTypingIndicator();
        if (!resp.ok) throw new Error('Server error');
        
        const data = await resp.json();
        
        // 3. Tampilkan & Simpan balasan AI
        appendMessageText(data.reply, 'bot');
        chatHistory.push({ role: 'assistant', content: data.reply });
        // --- TAMBAHAN: SAVE KE "NOTES" ---
        saveHistory();

    } catch(err){
        hideTypingIndicator();
        console.error(err);
        appendMessageText('Maaf, terjadi kesalahan saat menghubungi server.', 'bot');
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
            const welcomeMessage = "Halo! Saya **Ata AI**, asisten AI yang dibuat oleh **Arkananta**. Ada yang bisa saya bantu?";
            appendMessageText(welcomeMessage, 'bot');
            // Kita NGGAK save sapaan ini ke history, biar nggak diulang-ulang
        }, 100);
    }
});