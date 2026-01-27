// === CONFIGURACIÓN Y ESTADO ===
const API_URL = "http://127.0.0.1:8000/chat";
const MEMORY_URL = "http://127.0.0.1:8000/update_memory";
let isGenerating = false; // SEMÁFORO GLOBAL 🚦
let abortController = null; // CONTROL DE CANCELACIÓN (RED)
let isStopped = false;      // CONTROL DE CANCELACIÓN (VISUAL)
let selectedFile = null;    // ARCHIVO SELECCIONADO (MULTIMODAL)

marked.setOptions({ breaks: true });

// SUGERENCIAS RENOVADAS
const suggestionPool = [
    { label: "🫀 Caso Clínico IAM", text: "Plantéame un caso clínico de un paciente con síntomas de infarto agudo de miocardio." },
    { label: "🧠 Escala Glasgow", text: "Explícame cómo se evalúa la Escala de Coma de Glasgow." },
    { label: "💉 Calendario Vacunal", text: "¿Cuáles son las vacunas obligatorias en el primer año de vida?" },
    { label: "📊 Interpretar Gasometría", text: "Ayúdame a interpretar una gasometría arterial paso a paso." },
    { label: "📑 Referencias Vancouver", text: "Ponme un ejemplo de cita bibliográfica estilo Vancouver." },
    { label: "🚑 Protocolo Ictus", text: "¿Cuál es el código Ictus y sus tiempos clave?" },
    { label: "🧬 Anatomía Renal", text: "Resumen de la anatomía y fisiología del riñón." }
];

let currentChatId = null;
let chatHistory = JSON.parse(localStorage.getItem('medicarama_history')) || {};

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    renderHistorySidebar();
    startNewChatUI();
    
    // Cerrar menús al hacer clic fuera
    window.onclick = (e) => {
        if (!e.target.matches('.options-btn')) {
            document.querySelectorAll('.dropdown-menu')
                    .forEach(d => d.classList.remove('show'));
        }
    };
});

function generateId() { 
    return Date.now().toString(36) + Math.random().toString(36).substr(2); 
}

// === GESTIÓN DE BOTONES ===
function toggleInputButtons(showStop) {
    const sendBtn = document.getElementById("send-btn");
    const stopBtn = document.getElementById("stop-btn");
    if(showStop) {
        sendBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
    } else {
        sendBtn.style.display = 'flex';
        stopBtn.style.display = 'none';
    }
}

// === GESTIÓN DE ARCHIVOS (NUEVO) ===
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    selectedFile = file;

    const container = document.getElementById('file-preview-container');
    const imgPreview = document.getElementById('preview-img');
    const iconPreview = document.getElementById('preview-icon');
    const fileName = document.getElementById('file-name');

    container.classList.add('active');
    fileName.innerText = file.name;

    // Mostrar miniatura si es imagen
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imgPreview.src = e.target.result;
            imgPreview.style.display = 'block';
            iconPreview.style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        imgPreview.style.display = 'none';
        iconPreview.style.display = 'block';
    }
}

function clearFileSelection() {
    selectedFile = null;
    document.getElementById('file-input').value = ""; // Limpiar input
    document.getElementById('file-preview-container').classList.remove('active');
}

// === FUNCIÓN DE PARADA ===
function stopGeneration() {
    // 1. Detener efecto visual de escritura
    isStopped = true;

    // 2. Detener petición de red (si está pensando)
    if(abortController) {
        abortController.abort();
        abortController = null;
    }

    // Feedback visual
    const chatBox = document.getElementById("chat-box");
    if(chatBox.lastElementChild) {
        const bubble = chatBox.lastElementChild.querySelector('.message-bubble');
        if(bubble && !bubble.innerText.includes("[Detenido]")) {
                bubble.innerHTML += " <br><span style='color:#ef4444; font-size:0.9em;'><i>⏹️ Generación detenida</i></span>";
                bubble.classList.remove('cursor');
        }
    }
    
    // Restaurar estado
    isGenerating = false;
    toggleInputButtons(false);
}

// === GESTIÓN DE CHATS ===

async function startNewChatUI() {
    // 🛑 SI ESTÁ ESCRIBIENDO, BLOQUEAR
    if (isGenerating) {
        alert("Espera a que termine la respuesta actual.");
        return;
    }

    window.speechSynthesis.cancel();
    currentChatId = generateId();
    
    document.getElementById("chat-box").innerHTML = '';
    
    const mainContent = document.getElementById("main-content");
    mainContent.classList.add("start-mode");

    // Sugerencias aleatorias
    const shuffled = suggestionPool.sort(() => 0.5 - Math.random()).slice(0, 3);
    const suggestionsHTML = shuffled.map(item => 
        `<button class="suggestion-chip" onclick="useSuggestion('${item.text}')">
            ${item.label}
        </button>`
    ).join('');
    
    document.getElementById("suggestions-wrapper").innerHTML = suggestionsHTML;

    document.querySelectorAll('.history-item').forEach(btn => btn.classList.remove('active'));
    
    clearFileSelection(); // Limpiar archivos pendientes
    await syncBackendMemory([]);
    
    if (window.innerWidth <= 768) toggleSidebar();
    setTimeout(() => document.getElementById("user-input").focus(), 100);
}

async function loadChatFromHistory(id) {
    // 🛑 SI ESTÁ ESCRIBIENDO, BLOQUEAR
    if (isGenerating) {
        alert("Espera a que termine la respuesta actual.");
        return;
    }

    window.speechSynthesis.cancel();
    if (!chatHistory[id]) return;
    currentChatId = id;
    const chatData = chatHistory[id];
    
    activateChatMode();

    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = ''; 
    
    chatData.messages.forEach(msg => {
        const bubble = createMessageBubble(msg.sender);
        bubble.innerHTML = processText(msg.text);
        
        if(msg.sender === 'bot') {
            renderMathInElement(bubble, { 
                delimiters: [ 
                    {left: "$$", right: "$$", display: true}, 
                    {left: "$", right: "$", display: false} 
                ] 
            });
            
            if (msg.sources) renderSources(bubble, msg.sources);
            addAudioButton(bubble);
        }
    });

    clearFileSelection(); // Limpiar archivos
    const memoryPayload = chatData.messages.map(m => ({ 
        role: m.sender, 
        text: m.text 
    }));
    await syncBackendMemory(memoryPayload);

    renderHistorySidebar();
    
    // Cerrar menú móvil al seleccionar chat
    if (window.innerWidth <= 768) {
        const sb = document.getElementById('sidebar');
        const overlay = document.getElementById('mobile-overlay');
        sb.classList.remove('mobile-open');
        overlay.classList.remove('active');
    }
}

function activateChatMode() {
    const mainContent = document.getElementById("main-content");
    if (mainContent.classList.contains("start-mode")) {
        mainContent.classList.remove("start-mode");
    }
}

function useSuggestion(text) {
    document.getElementById("user-input").value = text;
    sendMessage();
}

// === ENVÍO DE MENSAJES (SOPORTE ARCHIVOS) ===

async function sendMessage() {
    const input = document.getElementById("user-input");
    const text = input.value.trim();
    
    // Permitir envío si hay texto O si hay archivo
    if ((!text && !selectedFile) || isGenerating) return; 

    // 1. PREPARAR UI
    isGenerating = true;
    isStopped = false;      
    toggleInputButtons(true); // Mostrar botón Stop

    activateChatMode(); 
    
    // Renderizar mensaje usuario (con indicador de archivo si lo hay)
    let userDisplay = text;
    if (selectedFile) {
        userDisplay += ` <br><small style="opacity:0.7">📎 <i>Adjunto: ${selectedFile.name}</i></small>`;
    }
    
    addMessage(userDisplay, 'user');
    
    input.value = "";
    input.style.height = "auto";
    input.focus(); 
    
    saveMessageToHistory(currentChatId, 'user', userDisplay, null);

    const bubble = createMessageBubble('bot');
    bubble.classList.add('cursor');

    // Preparamos controlador de aborto
    abortController = new AbortController();

    try {
        // 2. PETICIÓN (USANDO FORMDATA PARA ARCHIVOS)
        const formData = new FormData();
        formData.append("texto", text); // El backend espera 'texto'
        
        if (selectedFile) {
            formData.append("archivo", selectedFile); // El backend espera 'archivo'
        }

        // Limpiamos la selección visual inmediatamente
        clearFileSelection();

        const response = await fetch(API_URL, {
            method: "POST", 
            body: formData, // fetch pone el Content-Type multipart automáticamente
            signal: abortController.signal 
        });

        if (!response.ok) throw new Error("Error API");
        const data = await response.json();

        // 3. EFECTO VISUAL (Si no se ha parado antes)
        if(!isStopped) {
            await typeWriterEffect(bubble, data.respuesta, data.fuentes);
            
            // Guardar solo si se completó (o guardar parcial)
            if(!isStopped) {
                saveMessageToHistory(currentChatId, 'bot', data.respuesta, data.fuentes);
            }
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log("Petición cancelada por usuario.");
        } else {
            console.error(error);
            bubble.innerText = "⚠️ Error de conexión.";
            bubble.classList.remove('cursor');
        }
    } finally {
        // 4. LIMPIEZA
        isGenerating = false;      
        toggleInputButtons(false);
        abortController = null;
    }
}

// --- EFECTO ESCRITURA (ARREGLO CON STOP) ---
function typeWriterEffect(element, fullText, sources = []) {
    return new Promise((resolve) => {
        let i = 0; 
        let currentText = "";
        
        function type() {
            // SI SE PULSA STOP, PARAMOS
            if (isStopped) {
                resolve();
                return;
            }

            // 👀 SI EL USUARIO NO MIRA LA PESTAÑA, ACABAR DE GOLPE
            if (document.hidden) {
                element.innerHTML = processText(fullText);
                finish();
                return;
            }

            if (i < fullText.length) {
                const chunk = fullText.slice(i, i + 3);
                currentText += chunk;
                element.innerHTML = processText(currentText);
                
                const chatBox = document.getElementById("chat-box");
                // Auto-scroll inteligente
                if((chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight) < 100) {
                    chatBox.scrollTop = chatBox.scrollHeight;
                }
                
                i += 3; 
                setTimeout(type, 10);
            } else {
                finish();
            }
        }

        function finish() {
            // Solo renderizamos extras si NO se ha parado
            if(!isStopped) {
                element.innerHTML = processText(fullText); 
                element.classList.remove('cursor');
                
                renderMathInElement(element, { 
                    delimiters: [ {left: "$$", right: "$$", display: true} ] 
                });
                renderSources(element, sources);
                addAudioButton(element);
            }
            
            document.getElementById("chat-box").scrollTop = 
                document.getElementById("chat-box").scrollHeight;
            
            resolve();
        }
        
        type();
    });
}

// --- AUDIO Y VOZ (SISTEMA DUAL) ---

// 1. ESTÉTICA: Crear el botón bonito
function addAudioButton(el) { 
    const btn = document.createElement('button');
    btn.className = 'audio-dynamic-btn'; 
    btn.onclick = function() { speakText(this); }; 

    // OJO: RUTA ACTUALIZADA A static/images/
    const img = document.createElement('img');
    img.src = 'static/images/speaker.webp'; // Icono por defecto
    img.alt = 'Escuchar';

    btn.appendChild(img);
    el.appendChild(btn); 
}

// 2. LÓGICA: Controlar reproducción y cambio de iconos
function speakText(btn) {
    const img = btn.querySelector('img');
    // RUTAS ACTUALIZADAS
    const iconHablar = 'static/images/speaker.webp';
    const iconParar  = 'static/images/mute.png';

    // A. SI YA HABLA -> PARAR
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        // Restaurar todos los iconos
        document.querySelectorAll('.audio-dynamic-btn img').forEach(i => {
            i.src = iconHablar;
        });
        return;
    }

    // B. SI ESTÁ CALLADO -> HABLAR
    let container = btn.parentElement.cloneNode(true);
    let buttons = container.querySelectorAll('button'); 
    buttons.forEach(b => b.remove()); 
    const text = container.innerText;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';

    utterance.onstart = function() { img.src = iconParar; };
    utterance.onend = function() { img.src = iconHablar; };
    utterance.onerror = function() { img.src = iconHablar; };

    window.speechSynthesis.speak(utterance);
}

// --- HELPERS (SPOILERS INSTANTÁNEOS, HISTORIAL, ETC) ---

function processText(rawText) {
    // Dividimos el texto cada vez que aparecen las barras
    const parts = rawText.split('||');
    let processedHtml = "";
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        // PARTES PARES (0, 2, 4...) -> TEXTO NORMAL
        if (i % 2 === 0) {
            processedHtml += part;
        } 
        // PARTES IMPARES (1, 3, 5...) -> SPOILER (Abierto o Cerrado)
        else {
            // Si el trozo está vacío, no pintamos nada aún
            if (part.length === 0) continue;

            // Pintamos el cuadro gris INMEDIATAMENTE
            processedHtml += `<span class="spoiler" 
                                onclick="this.classList.toggle('revealed')" 
                                title="Click para ver">${part}</span>`;
        }
    }
    return marked.parse(processedHtml);
}

function renderSources(element, sources) {
    if (!sources || sources.length === 0) return;

    // 1. FILTRO DE PRIVACIDAD
    let validSources = sources.filter(src => {
        const tituloUpper = src.titulo.toUpperCase();
        return !tituloUpper.includes("TFG") && !tituloUpper.includes("PRIVADO");
    });

    // 2. DEDUPLICACIÓN
    const uniqueSources = [];
    const seenTitles = new Set(); 

    validSources.forEach(src => {
        const titleKey = src.titulo.trim(); 
        if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            uniqueSources.push(src);
        }
    });

    // 3. RECORTAR A 4
    const topSources = uniqueSources.slice(0, 4);

    if (topSources.length === 0) return;

    // 4. RENDERIZADO
    const sourcesDiv = document.createElement('div');
    sourcesDiv.className = 'sources-container';
    
    topSources.forEach(src => {
        const badge = document.createElement('a');
        badge.className = 'source-badge public';
        
        let urlWeb = src.url;
        if (urlWeb && urlWeb.startsWith("gs://")) {
            urlWeb = urlWeb.replace("gs://", "https://storage.googleapis.com/");
        }

        if (urlWeb) {
            // --- AQUÍ ESTÁ LA MAGIA DEL SALTO DE PÁGINA ---
            if (src.pagina) {
                urlWeb += `#page=${src.pagina}`; // Añadimos el ancla al PDF
            }
            
            badge.href = urlWeb;
            badge.target = "_blank";
            
            // Texto del título
            let displayTitle = src.titulo;
            if (displayTitle.length > 30) displayTitle = displayTitle.substring(0, 27) + "...";
            
            // Añadimos visualmente el número de página si existe
            const pageText = src.pagina ? ` <span style="opacity:0.7; font-size:0.7em;">(Pág. ${src.pagina})</span>` : '';

            badge.innerHTML = `<span class="source-icon">📄</span> ${displayTitle}${pageText}`;
            sourcesDiv.appendChild(badge);
        }
    });
    
    element.appendChild(sourcesDiv);
}

function createMessageBubble(sender) {
    const chatBox = document.getElementById("chat-box");
    const row = document.createElement("div");
    row.className = `message-row ${sender}`;
    row.innerHTML = `<div class="avatar ${sender}-avatar">${sender==='user'?'👤':'🤖'}</div><div class="message-bubble"></div>`;
    const bubble = row.querySelector(".message-bubble");
    chatBox.appendChild(row);
    return bubble;
}

function addMessage(text, sender) { 
    const bubble = createMessageBubble(sender); 
    
    // Usamos innerHTML para permitir etiquetas como <small> para el archivo
    bubble.innerHTML = text; 
}

function saveMessageToHistory(id, sender, text, sources = null) {
    if (!chatHistory[id]) {
        // Limpiamos etiquetas HTML para el título
        let cleanText = text.replace(/<[^>]*>/g, '');
        
        let title = cleanText.length > 30 ? cleanText.substring(0, 30) + "..." : cleanText;
        if (sender === 'bot') title = "Nueva consulta";
        chatHistory[id] = { title: title, timestamp: Date.now(), messages: [] };
    }
    if (sender === 'user' && chatHistory[id].messages.length === 0) {
            let cleanText = text.replace(/<[^>]*>/g, '');
            chatHistory[id].title = cleanText.length > 25 ? cleanText.substring(0, 25) + "..." : cleanText;
    }
    chatHistory[id].messages.push({ sender, text, sources: sources });
    chatHistory[id].timestamp = Date.now();
    localStorage.setItem('medicarama_history', JSON.stringify(chatHistory));
    renderHistorySidebar();
}

async function syncBackendMemory(messages) {
    try { 
        await fetch(MEMORY_URL, { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ messages: messages }) 
        }); 
    } catch (e) { console.error("Error sync", e); }
}

// --- EXPORTAR PDF ---
async function exportChatToPDF(id) {
    const chat = chatHistory[id]; 
    if (!chat) return;

    const loader = document.getElementById('pdf-loader');
    const loaderText = document.getElementById('loader-text');
    if(loader) loader.classList.add('active'); 
    if(loaderText) loaderText.innerText = "🧠 Redactando apuntes...";
    
    document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));

    try {
        // Limpiamos HTML del texto antes de enviar al PDF
        const messagePayload = chat.messages.map(m => ({ 
            role: m.sender, 
            text: m.text.replace(/<[^>]*>/g, '') 
        }));
        
        const response = await fetch("http://127.0.0.1:8000/generate_pdf_file", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: messagePayload })
        });

        if (!response.ok) throw new Error("Error del servidor: " + response.status);

        if(loaderText) loaderText.innerText = "⬇️ Descargando...";

        const blob = await response.blob(); 
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const cleanTitle = chat.title.substring(0,20).replace(/[^a-z0-9]/gi, '_');
        a.download = `Apuntes_${cleanTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

    } catch (error) {
        console.error("Error en JS:", error);
        alert("Hubo un error en la descarga.");
    } finally {
        setTimeout(() => { if(loader) loader.classList.remove('active'); }, 500);
    }
}

// --- UI SIDEBAR ---
function renderHistorySidebar() {
    const list = document.getElementById("history-list"); 
    list.innerHTML = '';
    const sortedIds = Object.keys(chatHistory).sort((a,b) => chatHistory[b].timestamp - chatHistory[a].timestamp);
    sortedIds.forEach(id => {
        const li = document.createElement("li");
        li.className = `history-item ${id === currentChatId ? 'active' : ''}`;
        li.innerHTML = `
            <button class="chat-title-btn" onclick="loadChatFromHistory('${id}')">💬 ${chatHistory[id].title}</button>
            <button class="options-btn" onclick="toggleDropdown(event, '${id}')">⋮</button>
            <div class="dropdown-menu" id="dropdown-${id}">
                <button class="dropdown-item" onclick="exportChatToPDF('${id}')">📄 Exportar PDF</button>
                <button class="dropdown-item delete" onclick="deleteChat('${id}')">🗑️ Borrar</button>
            </div>`;
        list.appendChild(li);
    });
}

function toggleDropdown(e, id) { 
    e.stopPropagation(); 
    document.querySelectorAll('.dropdown-menu').forEach(d => d.id !== `dropdown-${id}` && d.classList.remove('show')); 
    document.getElementById(`dropdown-${id}`).classList.toggle('show'); 
}

function deleteChat(id) { 
    if(confirm("¿Borrar chat?")) { 
        delete chatHistory[id]; 
        localStorage.setItem('medicarama_history', JSON.stringify(chatHistory)); 
        renderHistorySidebar(); 
        if(currentChatId === id) startNewChatUI(); 
    } 
}

function clearAllHistory() { 
    if (confirm("⚠️ ¿Borrar TODOS los chats?")) { 
        localStorage.removeItem('medicarama_history'); 
        chatHistory = {}; 
        renderHistorySidebar(); 
        startNewChatUI(); 
    } 
}

// --- MICROFONO (WEBKIT) ---
let rec; 
if ('webkitSpeechRecognition' in window) { 
    rec = new webkitSpeechRecognition(); 
    rec.lang = 'es-ES'; 
    rec.onstart = () => { document.getElementById('mic-btn').classList.add('listening'); }; 
    rec.onend = () => { document.getElementById('mic-btn').classList.remove('listening'); }; 
    rec.onresult = (e) => { 
        const i = document.getElementById('user-input'); 
        i.value += e.results[0][0].transcript + " "; 
        autoResize(i); 
    }; 
} 
function toggleVoice() { if(rec) try{ rec.start() } catch{ rec.stop() }; }

// --- RESPONSIVE SIDEBAR TOGGLE ---
function toggleSidebar() { 
    const sb = document.getElementById('sidebar'); 
    const overlay = document.getElementById('mobile-overlay');
    
    // Detectar móvil
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        // Lógica Móvil (clase transformation)
        sb.classList.toggle('mobile-open'); 
        overlay.classList.toggle('active');
    } else {
        // Lógica Desktop (margen negativo)
        sb.classList.toggle('closed'); 
    }
}

function toggleTheme() { document.body.classList.toggle('dark-mode'); }
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 150) + 'px'; }

function handleEnter(e) { 
    if (e.key === "Enter" && !e.shiftKey) { 
        e.preventDefault(); 
        if (!isGenerating) sendMessage(); // Respetar semáforo
    } 
}