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

// --- FUNGSI BARU: "Jaring Pengaman" Sederhana ---
// Ini adalah "penerjemah" level 1 kita
function simpleFormat(text) {
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // Handle **bold**
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<i>$1</i>');     // Handle *italic*
    formattedText = formattedText.replace(/\n/g, '<br>');               // Handle new lines
    return formattedText;
}

// FUNGSI DIREVISI: Menggunakan .innerHTML untuk bot (tapi super aman)
function appendMessageText(text, sender = 'bot'){
    const wrapper = el('div', ['message', `${sender}-message`]);
    const meta = el('div', ['meta']);
    
    const avatar = el('div', ['avatar']);
    avatar.textContent = sender === 'user' ? 'You' : 'AI';
    
    const info = el('div', ['info']);
    
    // --- PERUBAHAN ANTI-GAGAL v2 ---
    if (sender === "user") {
        // 1. Untuk user, SELALU pakai .textContent (AMAN)
        info.textContent = text;
    } else {
        // 2. Untuk bot, kita "CEK DULU"
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            // JALAN NORMAL (level 10: Marked.js + DOMPurify)
            info.innerHTML = DOMPurify.sanitize(marked.parse(text));
        } else {
            // JALAN AMAN (level 1: "Jaring Pengaman" Sederhana)
            console.warn("Marked.js/DOMPurify gagal load. Pake fallback simpleFormat.");
            info.innerHTML = simpleFormat(text); // Pake jaring pengaman kita yang pinter
        }
    }
    // --- AKHIR PERUBAHAN ---

    meta.appendChild(avatar);
    meta.appendChild(info);

    wrapper.appendChild(meta);
    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// FUNGSI DIREVISI: Sesuai CSS baru (.typing-indicator)
function showTypingIndicator(){
    if (document.getElementById('typing-indicator')) return;
    
    const wrap = el('div', ['message', 'bot-message']);
    wrap.id = 'typing-indicator'; // ID untuk dihapus
    
    const meta = el('div', ['meta']);
    const avatar = el('div', ['avatar']); 
    avatar.textContent = 'AI';
    
    const indicator = el('div', ['typing-indicator']);
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

// Pesan sambutan pertama kali (Pake "tunda" 100ms)
window.addEventListener('load', () => {
    setTimeout(() => {
        const welcomeMessage = "Halo! Saya **Ata AI**, asisten AI yang dibuat oleh **Arkananta**. Ada yang bisa saya bantu?";
        appendMessageText(welcomeMessage, 'bot');
    }, 100); 
});