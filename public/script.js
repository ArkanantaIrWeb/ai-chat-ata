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

// FUNGSI DIREVISI: Menggunakan .innerHTML untuk bot (tapi super aman)
function appendMessageText(text, sender = 'bot'){
    const wrapper = el('div', ['message', `${sender}-message`]);
    const meta = el('div', ['meta']);
    
    const avatar = el('div', ['avatar']);
    avatar.textContent = sender === 'user' ? 'You' : 'AI';
    
    const info = el('div', ['info']);
    
    // --- PERUBAHAN ANTI-GAGAL ---
    if (sender === "user") {
        // 1. Untuk user, SELALU pakai .textContent (AMAN)
        info.textContent = text;
    } else {
        // 2. Untuk bot, kita "CEK DULU"
        if (typeof marked !== 'undefined' && typeof DOMPurify !== 'undefined') {
            // JALAN NORMAL (jika library sukses ke-load)
            info.innerHTML = DOMPurify.sanitize(marked.parse(text));
        } else {
            // JALAN AMAN (jika library gagal ke-load, seenggaknya nggak crash)
            console.error("Marked.js atau DOMPurify gagal di-load!");
            // Kita pake cara "gepeng" darurat (tapi nggak crash)
            info.innerHTML = text.replace(/\n/g, '<br>');
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
    
    // REVISI: Buat .typing-indicator sebagai elemen sendiri
    const indicator = el('div', ['typing-indicator']);
    indicator.innerHTML = '<span></span><span></span><span></span>';
    
    meta.appendChild(avatar);
    meta.appendChild(indicator); // Tambahkan .typing-indicator, BUKAN .info
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

    // 1. Tampilkan & simpan pesan user
    appendMessageText(message, 'user');
    chatHistory.push({ role: 'user', content: message });

    userInput.value = '';
    userInput.focus();

    showTypingIndicator();

    try{
        // 2. Kirim riwayat ke backend
        const resp = await fetch('/chat', { // (Pastikan ini udah /chat, bukan localhost)
            method: 'POST', 
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({ messages: chatHistory })
        });
        
        hideTypingIndicator();
        if (!resp.ok) throw new Error('Server error');
        
        const data = await resp.json();
        
        // 3. Tampilkan & simpan balasan AI
        appendMessageText(data.reply, 'bot');
        chatHistory.push({ role: 'assistant', content: data.reply });

    } catch(err){
        hideTypingIndicator();
        console.error(err);
        appendMessageText('Maaf, terjadi kesalahan saat menghubungi server.', 'bot');
    }
});

// Pesan sambutan pertama kali (DIREVISI agar "Sabar")
window.addEventListener('load', () => {
    // Kita "tunda" 100 milidetik. Kasih napas buat CDN.
    setTimeout(() => {
        const welcomeMessage = "Halo! Saya Ata AI, asisten AI yang dibuat oleh Arkananta. Ada yang bisa saya bantu?";
        appendMessageText(welcomeMessage, 'bot');
    }, 100); 
});