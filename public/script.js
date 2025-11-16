// Grab elements
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');

// Riwayat chat untuk "ingatan" AI
let chatHistory = [];

// Utility: create an element with optional classes
function el(tag, classes = []){
    const e = document.createElement(tag);
    classes.forEach(c => e.classList.add(c));
    return e;
}

// --- FUNGSI BARU UNTUK FORMAT TEKS ---
function formatMessage(text) {
    // 1. Ubah **bold** menjadi <b>bold</b>
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    
    // 2. Ubah \n (new line) menjadi <br>
    formattedText = formattedText.replace(/\n/g, '<br>');
    
    return formattedText;
}

// FUNGSI DIREVISI: Menggunakan .innerHTML untuk bot
function appendMessageText(text, sender = 'bot'){
    const wrapper = el('div', ['message', `${sender}-message`]);
    const meta = el('div', ['meta']);
    
    const avatar = el('div', ['avatar']);
    avatar.textContent = sender === 'user' ? 'You' : 'AI';
    
    const info = el('div', ['info']);
    
    // --- PERUBAHAN UTAMA DI SINI ---
    if (sender === 'user') {
        // 1. Untuk user, SELALU pakai .textContent (AMAN DARI XSS)
        info.textContent = text;
    } else {
        // 2. Untuk bot, format dulu, lalu pakai .innerHTML (untuk render HTML)
        info.innerHTML = formatMessage(text);
    }
    // --- AKHIR PERUBAHAN ---

    meta.appendChild(avatar);
    meta.appendChild(info);

    wrapper.appendChild(meta);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// FUNGSI DIREVISI: Menggunakan .innerHTML untuk typing
function showTypingIndicator(){
    if (document.getElementById('typing-indicator')) return;
    
    const wrap = el('div', ['message', 'bot-message']);
    wrap.id = 'typing-indicator';
    
    const meta = el('div', ['meta']);
    const avatar = el('div', ['avatar']); 
    avatar.textContent = 'AI';
    
    const indicator = el('div', ['typing-indicator']);
    // Kita pakai innerHTML di sini agar <span> render
    indicator.innerHTML = '<span></span><span></span><span></span>';
    
    meta.appendChild(avatar);
    meta.appendChild(indicator);
    wrap.appendChild(meta);
    chatMessages.appendChild(wrap);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Fungsi ini tetap sama
function hideTypingIndicator(){
    const elIndicator = document.getElementById('typing-indicator');
    if (elIndicator) elIndicator.remove();
}

// Submit handler (Tidak ada perubahan di sini)
chatForm.addEventListener('submit', async (e) =>{
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    appendMessageText(message, 'user');
    chatHistory.push({ role: 'user', content: message });

    userInput.value = '';
    userInput.focus();

    showTypingIndicator();

    try{
        const resp = await fetch('/chat', {
            method: 'POST', 
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ messages: chatHistory })
        });
        
        hideTypingIndicator();
        if (!resp.ok) throw new Error('Server error');
        
        const data = await resp.json();
        
        appendMessageText(data.reply, 'bot');
        chatHistory.push({ role: 'assistant', content: data.reply });

    } catch(err){
        hideTypingIndicator();
        console.error(err);
        appendMessageText('Maaf, terjadi kesalahan saat menghubungi server.', 'bot');
    }
});

// Pesan sambutan pertama kali (DIREVISI agar pakai format)
window.addEventListener('load', () => {
    // Sapaan publik baru
    const welcomeMessage = "Halo! Saya Ata AI, asisten AI yang dibuat oleh Arkananta. Ada yang bisa saya bantu?";
    
    appendMessageText(welcomeMessage, 'bot');
    // Kita tidak simpan ini di history, agar AI tidak bingung
});