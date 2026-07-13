// === ICONOS SVG (Lucide Icons — MIT) ===
// Inline para evitar peticiones extra y para que tomen color con currentColor.
const ICONS = {
    mic: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`,
    volumeOn: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
    volumeOff: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>`,
    fileText: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>`,
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
    chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    messageSquare: `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    moon: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
    trash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
    download: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
    closeX: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
};

// === CONFIGURACIÓN Y ESTADO ===
const API_URL = "/chat";
const MEMORY_URL = "/update_memory";
const MAX_FILES = 5;        // máximo archivos adjuntos por mensaje
let isGenerating = false; // SEMÁFORO GLOBAL 🚦
let abortController = null; // CONTROL DE CANCELACIÓN (RED)
let isStopped = false;      // CONTROL DE CANCELACIÓN (VISUAL)
let selectedFiles = [];     // array de {file, type: 'doc'|'img'}
let imageMode = false;      // si true, el próximo mensaje se envía con prefijo /img

marked.setOptions({ breaks: true });

// === AUTH HELPER ===
// Devuelve cabecera Authorization con el ID token actual de Firebase
// (auth.js expone window.tutorAuth.getCurrentToken). Si no hay sesión, {}.
async function authHeaders() {
    try {
        const token = window.tutorAuth && await window.tutorAuth.getCurrentToken();
        return token ? { "Authorization": "Bearer " + token } : {};
    } catch (e) {
        console.warn("authHeaders: no se pudo obtener token", e);
        return {};
    }
}

// === SCROLL TRACKING ===
// Detecta intención de scroll del usuario (wheel/touchmove) para no snap-ear
// hacia abajo durante el streaming si el usuario está leyendo más arriba.
let autoScrollEnabled = true;

function setupScrollTracking() {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox || chatBox._scrollTrackingSetup) return;
    chatBox._scrollTrackingSetup = true;

    chatBox.addEventListener('wheel', (e) => {
        if (e.deltaY < 0) autoScrollEnabled = false;
    }, { passive: true });

    chatBox.addEventListener('touchmove', () => {
        autoScrollEnabled = false;
    }, { passive: true });

    chatBox.addEventListener('scroll', () => {
        const distance = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight;
        if (distance < 20) autoScrollEnabled = true;
        updateScrollToBottomBtn();
    }, { passive: true });

    // Click del botón flotante "volver al final"
    const scrollBtn = document.getElementById('scroll-to-bottom-btn');
    if (scrollBtn) {
        scrollBtn.addEventListener('click', scrollChatToBottom);
    }
}

function maybeAutoScroll() {
    if (!autoScrollEnabled) return;
    const chatBox = document.getElementById('chat-box');
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function resetAutoScroll() {
    autoScrollEnabled = true;
    updateScrollToBottomBtn();
}

// === BOTÓN FLOTANTE "VOLVER AL FINAL" ===
function updateScrollToBottomBtn() {
    const btn = document.getElementById('scroll-to-bottom-btn');
    const chatBox = document.getElementById('chat-box');
    if (!btn || !chatBox) return;
    const distance = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight;
    // Lo mostramos cuando el usuario está scrolleado arriba (más de 200px del fondo)
    if (distance > 200) btn.classList.add('visible');
    else btn.classList.remove('visible');
}

function scrollChatToBottom() {
    const chatBox = document.getElementById('chat-box');
    if (!chatBox) return;
    chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
    autoScrollEnabled = true;
    updateScrollToBottomBtn();
}

// === LIGHTBOX DE IMÁGENES (visor a tamaño completo) ===
function openImageLightbox(src) {
    const lb = document.getElementById('image-lightbox');
    if (!lb) return;
    const img = lb.querySelector('.image-lightbox-img');
    const dl = lb.querySelector('.image-lightbox-download');
    if (img) img.src = src;
    if (dl) dl.href = src;
    lb.classList.add('visible');
    document.body.style.overflow = 'hidden'; // bloquea scroll del fondo mientras está abierto
}

function closeImageLightbox() {
    const lb = document.getElementById('image-lightbox');
    if (lb) lb.classList.remove('visible');
    document.body.style.overflow = '';
}

// === TOASTS (notificaciones inline efímeras) ===
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    // Auto-remove
    setTimeout(() => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// === THINKING INDICATOR (para modos sin streaming: imagen y multimodal) ===
// Muestra mensajes rotatorios para disimular el tiempo de espera.
function startThinkingIndicator(bubble, mode) {
    const messageSets = {
        file: [
            '📄 Leyendo el archivo...',
            '🔍 Analizando el contenido...',
            '🧠 Pensando con la IA...',
            '✨ Preparando respuesta...'
        ],
        img: [
            'Generando la imagen...',
            'Componiendo la escena...',
            'Renderizando detalles...',
            'Últimos retoques...'
        ]
    };
    const messages = messageSets[mode] || messageSets.file;

    bubble.classList.add('streaming');
    bubble.innerHTML = `<span class="thinking-text">${messages[0]}</span>`;

    let i = 0;
    const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        const el = bubble.querySelector('.thinking-text');
        if (!el) {
            clearInterval(interval);
            return;
        }
        el.style.opacity = '0';
        setTimeout(() => {
            el.textContent = messages[i];
            el.style.opacity = '';
        }, 250);
    }, 3000);

    return interval;
}

function stopThinkingIndicator(intervalId) {
    if (intervalId) clearInterval(intervalId);
}

// === STREAMING NDJSON HANDLER ===
// Arquitectura desacoplada:
//   - reader loop: consume el stream lo más rápido posible y rellena `receivedText`
//   - typewriter loop: pinta a velocidad controlada para sensación de lectura natural
// Esto evita race conditions entre recepción y render del DOM, y permite throttling
// sin perder chunks.

const STREAM_TYPING_CHARS_PER_TICK = 2;   // caracteres por tick
const STREAM_TYPING_TICK_MS        = 18;  // tick rate → ~111 chars/seg

async function handleStreamingResponse(response, bubble) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Texto total recibido del stream (puede ir por delante de lo mostrado)
    let receivedText = '';
    // Texto ya pintado al usuario
    let displayedText = '';

    let sources = [];
    let errored = false;
    let errorMessage = null;
    let streamFinished = false;

    bubble.classList.add('streaming');
    bubble.innerHTML = '';

    // === Typewriter pump: pinta `receivedText` a velocidad controlada ===
    const typewriterPromise = (async () => {
        while (true) {
            if (isStopped) return;

            if (displayedText.length < receivedText.length) {
                const pending = receivedText.length - displayedText.length;
                const burst = Math.min(STREAM_TYPING_CHARS_PER_TICK, pending);
                displayedText = receivedText.substring(0, displayedText.length + burst);
                bubble.innerHTML = processText(displayedText);
                maybeAutoScroll();
                await new Promise(r => setTimeout(r, STREAM_TYPING_TICK_MS));
            } else if (streamFinished) {
                return; // hemos pintado todo y el stream ha terminado
            } else {
                // Sin nada que pintar todavía; esperamos a que lleguen más chunks
                await new Promise(r => setTimeout(r, 25));
            }
        }
    })();

    // === Reader loop: parsea NDJSON línea a línea ===
    const processLine = (line) => {
        if (!line.trim()) return;
        let msg;
        try {
            msg = JSON.parse(line);
        } catch (e) {
            console.warn('NDJSON parse fail:', line);
            return;
        }
        if (msg.type === 'chunk' && typeof msg.text === 'string') {
            receivedText += msg.text;
            // No pintamos aquí: lo hace el typewriter pump
        } else if (msg.type === 'done') {
            sources = msg.sources || [];
        } else if (msg.type === 'error') {
            errored = true;
            errorMessage = msg.message || 'Error generando respuesta.';
        }
    };

    try {
        while (true) {
            if (isStopped) {
                try { await reader.cancel(); } catch (e) {}
                break;
            }
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) processLine(line);
        }
        if (buffer.trim()) processLine(buffer);

        // Esperamos a que el typewriter termine de pintar todo lo recibido
        streamFinished = true;
        await typewriterPromise;

        bubble.classList.remove('streaming');

        if (errored) {
            // Garantizamos que el texto recibido (si lo había) se pinta entero antes del error
            if (displayedText !== receivedText) {
                bubble.innerHTML = processText(receivedText);
            }
            bubble.innerHTML += `<br><span class="error-text">${errorMessage}</span>`;
            return;
        }

        // Si el usuario pulsó Stop a mitad: respetamos lo que se llegó a mostrar.
        // No forzamos el texto completo ni añadimos fuentes/audio (respuesta incompleta).
        if (isStopped) {
            bubble.innerHTML = processText(displayedText);
            return;
        }

        // RENDER FINAL DEFENSIVO (solo si NO se detuvo): garantiza que el texto
        // completo está pintado, por si el typewriter no llegó al final.
        bubble.innerHTML = processText(receivedText);
        try {
            renderMathInElement(bubble, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ]
            });
        } catch (e) { /* KaTeX puede fallar con LaTeX inválido, no crítico */ }
        if (sources.length > 0) renderSources(bubble, sources);
        addAudioButton(bubble);
        maybeAutoScroll();

        // === FIX BUG: GUARDAR LA RESPUESTA DEL BOT EN HISTORIAL ===
        // Antes solo se guardaba el mensaje del usuario, por eso al recargar
        // chats antiguos aparecían vacíos.
        if (typeof saveMessageToHistory === 'function') {
            saveMessageToHistory(currentChatId, 'bot', receivedText, sources);
        }
    } catch (err) {
        streamFinished = true;
        bubble.classList.remove('streaming');
        if (err.name === 'AbortError') return;
        console.error('Stream error:', err);
        bubble.innerHTML = receivedText
            ? processText(receivedText) + '<br><span class="error-text">Conexión interrumpida.</span>'
            : '<span class="error-text">Error de conexión.</span>';
    }
}

let currentChatId = null;
let chatHistory = JSON.parse(localStorage.getItem('medicarama_history')) || {};

// === ALTURA REAL DEL VIEWPORT EN MÓVIL ===
// En móvil 100vh NO encoge al abrir el teclado, así que la barra de escribir
// quedaba oculta detrás del teclado. visualViewport.height SÍ refleja el teclado
// (iOS Safari y Chrome Android): lo volcamos en --app-height y el body usa esa
// altura -> el input siempre visible sobre el teclado.
(function setupMobileViewport() {
    const vv = window.visualViewport;
    const root = document.documentElement;
    let lastH = 0;
    function applyHeight() {
        // Solo escribimos si la altura cambia DE VERDAD. En móvil visualViewport
        // dispara 'scroll' constantemente; reescribir la variable en cada evento
        // provocaba tirones al desplazar el chat con el teclado abierto.
        const h = Math.round(vv ? vv.height : window.innerHeight);
        if (h === lastH) return;
        lastH = h;
        root.style.setProperty('--app-height', h + 'px');
    }
    applyHeight();
    if (vv) vv.addEventListener('resize', applyHeight);
    window.addEventListener('resize', applyHeight);
    window.addEventListener('orientationchange', () => setTimeout(applyHeight, 200));
})();

// === INICIALIZACIÓN ===
document.addEventListener('DOMContentLoaded', () => {
    renderHistorySidebar();
    startNewChatUI();
    setupScrollTracking();

    // Una vez que Firebase Auth ha restaurado/confirmado la sesión y emite 'authReady',
    // re-sincronizamos el estado del backend (resetea chat_history a vacío para esta sesión).
    // Sin esto, el primer startNewChatUI llamado en DOMContentLoaded no llega a sincronizar
    // porque la sesión Firebase aún no estaba lista.
    window.addEventListener('authReady', () => {
        syncBackendMemory([]);
    });

    // Cerrar menús al hacer clic fuera
    window.onclick = (e) => {
        if (!e.target.matches('.options-btn')) {
            document.querySelectorAll('.dropdown-menu')
                    .forEach(d => d.classList.remove('show'));
        }
        // Cerrar el menú de adjuntar si el click no fue en el botón "+" ni dentro del menú
        const attachMenu = document.getElementById('attach-menu');
        const attachBtn = document.getElementById('attach-btn');
        if (attachMenu && attachMenu.classList.contains('show')) {
            if (!attachBtn.contains(e.target) && !attachMenu.contains(e.target)) {
                closeAttachMenu();
            }
        }
    };

    // Cerrar menús / cancelar modo imagen / cerrar lightbox con Escape
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAttachMenu();
            if (imageMode) cancelImageMode();
            closeImageLightbox();
        }
    });

    // Lightbox: cerrar al hacer click fuera de la imagen (en el overlay)
    const lb = document.getElementById('image-lightbox');
    if (lb) {
        lb.addEventListener('click', (e) => {
            // Cerrar si se hace click en el overlay (no en la imagen, no en el botón de descarga)
            if (e.target === lb) closeImageLightbox();
        });
        const closeBtn = lb.querySelector('.image-lightbox-close');
        if (closeBtn) closeBtn.addEventListener('click', closeImageLightbox);
    }
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

// === GESTIÓN DE ARCHIVOS Y MENÚ DE ADJUNTAR ===

function toggleAttachMenu(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('attach-menu');
    const btn = document.getElementById('attach-btn');
    const isShown = menu.classList.toggle('show');
    if (btn) btn.setAttribute('aria-expanded', isShown ? 'true' : 'false');
}

function closeAttachMenu() {
    const menu = document.getElementById('attach-menu');
    const btn = document.getElementById('attach-btn');
    if (menu) menu.classList.remove('show');
    if (btn) btn.setAttribute('aria-expanded', 'false');
}

function openFilePicker(type) {
    closeAttachMenu();
    const inputId = type === 'img' ? 'file-input-imgs' : 'file-input-docs';
    document.getElementById(inputId).click();
}

function handleFilesSelect(event, fileType) {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length === 0) return;

    // Si está en modo imagen, lo cancelamos al adjuntar (incompatibles)
    if (imageMode) cancelImageMode();

    // Comprobar tope de 5 archivos en total
    if (selectedFiles.length + newFiles.length > MAX_FILES) {
        const disponibles = MAX_FILES - selectedFiles.length;
        if (disponibles > 0) {
            showToast(`Solo puedes añadir ${disponibles} archivo${disponibles === 1 ? '' : 's'} más (máx ${MAX_FILES})`, 'warning', 3500);
        } else {
            showToast(`Ya tienes el máximo de ${MAX_FILES} archivos`, 'warning', 3500);
        }
        event.target.value = '';
        return;
    }

    for (const file of newFiles) {
        selectedFiles.push({ file, type: fileType });
    }

    renderFilesPreview();
    updateAttachOptionsState();
    event.target.value = ''; // permite re-seleccionar el mismo archivo en el futuro
}

function updateAttachOptionsState() {
    const atMax = selectedFiles.length >= MAX_FILES;
    document.querySelectorAll('.attach-option[data-attach-type]').forEach(opt => {
        opt.disabled = atMax;
        opt.classList.toggle('attach-option-disabled', atMax);
    });
}

function renderFilesPreview() {
    const container = document.getElementById('file-preview-container');
    if (!container) return;

    if (selectedFiles.length === 0) {
        container.classList.remove('active');
        container.innerHTML = '';
        return;
    }

    container.classList.add('active');
    container.innerHTML = '';

    selectedFiles.forEach((item, index) => {
        const pill = document.createElement('div');
        pill.className = 'file-pill';
        const icon = item.type === 'img' ? '🖼️' : '📄';
        const displayName = item.file.name.length > 22
            ? item.file.name.substring(0, 19) + '...'
            : item.file.name;
        pill.innerHTML = `
            <span class="file-pill-icon">${icon}</span>
            <span class="file-pill-name" title="${item.file.name}">${displayName}</span>
            <button type="button" class="file-pill-remove" aria-label="Quitar archivo" data-index="${index}">✕</button>
        `;
        container.appendChild(pill);
    });

    // Bind remove buttons (después de pintar)
    container.querySelectorAll('.file-pill-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index, 10);
            removeFile(idx);
        });
    });
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFilesPreview();
    updateAttachOptionsState();
}

function clearFileSelection() {
    selectedFiles = [];
    const inputDocs = document.getElementById('file-input-docs');
    const inputImgs = document.getElementById('file-input-imgs');
    if (inputDocs) inputDocs.value = '';
    if (inputImgs) inputImgs.value = '';
    renderFilesPreview();
    updateAttachOptionsState();
}

// === MODO GENERACIÓN DE IMAGEN ===

function activateImageMode() {
    closeAttachMenu();
    // Si hay archivos seleccionados, son incompatibles con modo imagen
    if (selectedFiles.length > 0) {
        if (!confirm('Activar modo imagen quitará los archivos que tienes adjuntos. ¿Continuar?')) return;
        clearFileSelection();
    }
    imageMode = true;
    // Salimos de start-mode para que el banner no se solape con el welcome screen
    activateChatMode();
    const banner = document.getElementById('img-mode-banner');
    if (banner) banner.classList.add('active');
    const input = document.getElementById('user-input');
    if (input) {
        input.placeholder = 'Describe la imagen a generar...';
        input.focus();
    }
}

function cancelImageMode() {
    imageMode = false;
    const banner = document.getElementById('img-mode-banner');
    if (banner) banner.classList.remove('active');
    const input = document.getElementById('user-input');
    if (input) {
        input.placeholder = 'Pregunta sobre TFG, Urgencias, Triaje...';
    }
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
                bubble.classList.remove('streaming');
        }
    }

    // Restaurar estado
    isGenerating = false;
    toggleInputButtons(false);
}

// === GESTIÓN DE CHATS ===

async function startNewChatUI() {
    // SI ESTÁ ESCRIBIENDO, BLOQUEAR
    if (isGenerating) {
        alert("Espera a que termine la respuesta actual.");
        return;
    }

    window.speechSynthesis.cancel();
    currentChatId = generateId();
    
    document.getElementById("chat-box").innerHTML = '';
    
    const mainContent = document.getElementById("main-content");
    mainContent.classList.add("start-mode");

    // Sugerencias eliminadas: eran genéricas y no encajaban con el curso del alumno.
    const sw = document.getElementById("suggestions-wrapper");
    if (sw) sw.innerHTML = "";

    document.querySelectorAll('.history-item').forEach(btn => btn.classList.remove('active'));
    
    clearFileSelection(); // Limpiar archivos pendientes
    await syncBackendMemory([]);
    
    if (window.innerWidth <= 768) toggleSidebar();
    setTimeout(() => document.getElementById("user-input").focus(), 100);
}

async function loadChatFromHistory(id) {
    // SI ESTÁ ESCRIBIENDO, BLOQUEAR
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

    // Permitir envío si hay texto O si hay archivos
    if ((!text && selectedFiles.length === 0) || isGenerating) return;

    // 1. PREPARAR UI
    isGenerating = true;
    isStopped = false;
    toggleInputButtons(true); // Mostrar botón Stop

    activateChatMode();

    // Renderizar mensaje usuario (con indicador de archivos si los hay)
    let userDisplay = text;
    if (selectedFiles.length > 0) {
        const fileNames = selectedFiles.map(f => f.file.name).join(', ');
        const label = selectedFiles.length === 1 ? 'Adjunto' : `${selectedFiles.length} adjuntos`;
        userDisplay += ` <br><small style="opacity:0.7"> <i>${label}: ${fileNames}</i></small>`;
    }
    if (imageMode && !selectedFiles.length) {
        userDisplay = `<small style="opacity:0.6">🎨 </small>` + userDisplay;
    }

    addMessage(userDisplay, 'user');

    input.value = "";
    input.style.height = "auto";
    input.focus();

    // Guardar en historial
    if (typeof saveMessageToHistory === 'function') {
        saveMessageToHistory(currentChatId, 'user', userDisplay, null);
    }

    // Crear burbuja del bot
    const bubble = createMessageBubble('bot');

    // Reseteamos auto-scroll para este nuevo mensaje
    resetAutoScroll();

    // Snapshot del estado para esta petición (clearFileSelection lo limpia después)
    const isImgMode = imageMode;
    const filesToSend = selectedFiles.slice();
    const isMultimodal = filesToSend.length > 0;
    let thinkingInterval = null;

    if (isMultimodal) {
        thinkingInterval = startThinkingIndicator(bubble, 'file');
    } else if (isImgMode) {
        thinkingInterval = startThinkingIndicator(bubble, 'img');
    } else {
        bubble.classList.add('streaming');
    }

    // Preparamos controlador de aborto
    abortController = new AbortController();

    try {
        // 2. PETICIÓN
        const formData = new FormData();
        let textToSend = text;
        if (isImgMode) textToSend = "/img " + text;
        formData.append("texto", textToSend);

        // Adjuntar TODOS los archivos como "archivos" (lista)
        filesToSend.forEach(item => {
            formData.append("archivos", item.file);
        });

        // Limpiamos selección y modo imagen (se consumieron en esta petición)
        clearFileSelection();
        if (imageMode) cancelImageMode();

        const url = (typeof API_URL !== 'undefined') ? API_URL : '/chat';

        const response = await fetch(url, {
            method: "POST",
            headers: await authHeaders(),
            body: formData,
            signal: abortController.signal
        });

        if (!response.ok) {
            let detalle = '';
            try {
                const errData = await response.json();
                detalle = errData.detail || errData.error || errData.respuesta || '';
            } catch (e) { /* respuesta sin cuerpo JSON */ }
            if (response.status === 403 && /email/i.test(detalle)) {
                throw new Error('EMAIL_NOT_VERIFIED');
            }
            if (response.status === 401) throw new Error('AUTH_EXPIRED');
            throw new Error("Error API: " + response.status);
        }

        const contentType = response.headers.get('content-type') || '';

        // CASO A: STREAMING (modo texto puro)
        if (contentType.includes('ndjson')) {
            stopThinkingIndicator(thinkingInterval);
            thinkingInterval = null;
            await handleStreamingResponse(response, bubble);
        }
        // CASO B: JSON (imagen o multimodal con archivo)
        else {
            const data = await response.json();
            stopThinkingIndicator(thinkingInterval);
            thinkingInterval = null;
            bubble.classList.remove('streaming');

            if (data.imagen_base64) {
                const textoHTML = data.respuesta ? `<p>${data.respuesta}</p>` : "";
                const src = `data:image/png;base64,${data.imagen_base64}`;
                // Escapamos comillas simples para no romper el atributo onclick
                const safeSrc = src.replace(/'/g, "\\'");
                bubble.innerHTML = `
                    ${textoHTML}
                    <div class="generated-image-wrapper" onclick="openImageLightbox('${safeSrc}')" role="button" tabindex="0" aria-label="Ampliar imagen">
                        <img src="${src}" class="ai-image" alt="Imagen generada">
                        <a href="${src}" download="medicarama_imagen.png"
                           class="download-btn-floating"
                           onclick="event.stopPropagation()"
                           title="Descargar imagen"
                           aria-label="Descargar imagen">
                            ${ICONS.download}
                        </a>
                    </div>
                `;
                maybeAutoScroll();
                // Guardar respuesta de imagen en historial (texto + nota de imagen)
                if (typeof saveMessageToHistory === 'function') {
                    const imgPlaceholder = (data.nota_historial || data.respuesta || '') + '\n\n*[Imagen generada — no persistida en historial]*';
                    saveMessageToHistory(currentChatId, 'bot', imgPlaceholder, []);
                }
            } else {
                // Multimodal: la respuesta llega ENTERA (este path no streamea),
                // pero la "tecleamos" con typeWriterEffect para dar la misma
                // sensación de escritura progresiva que el modo texto. La propia
                // función pinta al final las fórmulas, las fuentes y el audio.
                bubble.classList.add('streaming');
                await typeWriterEffect(bubble, data.respuesta || '', data.fuentes || []);
                bubble.classList.remove('streaming');
                maybeAutoScroll();
                // Guardar respuesta multimodal en historial
                if (typeof saveMessageToHistory === 'function') {
                    saveMessageToHistory(currentChatId, 'bot', data.respuesta || '', data.fuentes || []);
                }
            }
        }

    } catch (error) {
        stopThinkingIndicator(thinkingInterval);
        bubble.classList.remove('streaming');
        if (error.name === 'AbortError') {
            console.log("Petición cancelada por usuario.");
        } else if (error.message === 'EMAIL_NOT_VERIFIED') {
            bubble.innerHTML = '<span class="error-text">Tu correo aún no está verificado. Revisa tu email (mira también spam), confirma la cuenta y vuelve a iniciar sesión.</span>';
        } else if (error.message === 'AUTH_EXPIRED') {
            bubble.innerHTML = '<span class="error-text">Tu sesión ha caducado. Vuelve a iniciar sesión para continuar.</span>';
        } else {
            console.error(error);
            bubble.innerHTML = '<span class="error-text">Error de conexión o respuesta inesperada.</span>';
        }
    } finally {
        // 4. LIMPIEZA Y RESTAURACIÓN DE ESTADO
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
                    delimiters: [
                        {left: "$$", right: "$$", display: true},
                        {left: "$", right: "$", display: false}
                    ]
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

// 1. ESTÉTICA: Crear el botón bonito (SVG inline desde ICONS, no imágenes)
function addAudioButton(el) {
    const btn = document.createElement('button');
    btn.className = 'audio-dynamic-btn';
    btn.title = 'Escuchar respuesta';
    btn.setAttribute('aria-label', 'Escuchar respuesta');
    btn.onclick = function() { speakText(this); };
    btn.innerHTML = ICONS.volumeOn;
    el.appendChild(btn);
}

// Variable global para evitar que el Garbage Collector borre el audio en móviles
// --- VARIABLE GLOBAL OBLIGATORIA PARA MÓVILES ---
// (Si no está fuera de la función, el móvil borra el audio antes de que suene)
let currentUtterance = null;

function speakText(btn) {
    // 1. SI YA ESTÁ HABLANDO, LO PARAMOS
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        // Reseteamos todos los iconos al estado "hablar"
        document.querySelectorAll('.audio-dynamic-btn').forEach(b => { b.innerHTML = ICONS.volumeOn; });
        return;
    }

    // 2. PREPARAR TEXTO (Limpiamos botones internos si los hay)
    let container = btn.parentElement.cloneNode(true);
    let buttons = container.querySelectorAll('button');
    buttons.forEach(b => b.remove());
    const text = container.innerText;

    // 3. CREAR EL OBJETO DE VOZ
    currentUtterance = new SpeechSynthesisUtterance(text);

    // Selección de voz: el móvil a veces llama al español "es_ES", "spa-es", "es-MX", etc.
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('es'));
    if (voice) {
        currentUtterance.voice = voice;
        currentUtterance.lang = voice.lang;
    } else {
        currentUtterance.lang = 'es-ES';
    }
    currentUtterance.rate = 1.0;

    // 4. EVENTOS VISUALES: alternamos entre volumeOn ↔ volumeOff
    currentUtterance.onstart = function() { btn.innerHTML = ICONS.volumeOff; };
    currentUtterance.onend = function() { btn.innerHTML = ICONS.volumeOn; };
    currentUtterance.onerror = function(e) {
        console.error("Error Audio:", e);
        btn.innerHTML = ICONS.volumeOn;
    };

    // 5. ¡HABLAR!
    window.speechSynthesis.speak(currentUtterance);
}

// TRUCO EXTRA: Forzar carga de voces en iPhone/Android al cargar la página
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
        console.log("Voces cargadas.");
    };
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

    // 2. DEDUPLICACIÓN — por PDF (URL), no por título. El título es el NOMBRE
    // DEL CURSO, así que varios PDF del mismo curso (p.ej. distintos bloques)
    // se fusionaban en un solo badge. Deduplicando por la URL del PDF salen como
    // fuentes separadas (se distinguen por su nº de página).
    const uniqueSources = [];
    const seenDocs = new Set();

    validSources.forEach(src => {
        const key = ((src.url || src.titulo || '').split('#')[0].split('?')[0]).trim();
        if (key && !seenDocs.has(key)) {
            seenDocs.add(key);
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

            badge.innerHTML = `<span class="source-icon"></span> ${displayTitle}${pageText}`;
            sourcesDiv.appendChild(badge);
        }
    });
    
    element.appendChild(sourcesDiv);
}

function createMessageBubble(sender) {
    const chatBox = document.getElementById("chat-box");
    const row = document.createElement("div");
    row.className = `message-row ${sender}`;
    row.innerHTML = `<div class="avatar ${sender}-avatar"></div><div class="message-bubble"></div>`;
    const bubble = row.querySelector(".message-bubble");
    chatBox.appendChild(row);
    return bubble;
}

function addMessage(text, sender) { 
    const bubble = createMessageBubble(sender); 
    
    // Usamos innerHTML para permitir etiquetas como <small> para el archivo
    bubble.innerHTML = text; 
}

// CONFIGURACIÓN DE LIMPIEZA AUTOMÁTICA
const MAX_CHATS_GUARDADOS = 20;
const MAX_MENSAJES_POR_CHAT = 50;

function saveMessageToHistory(id, sender, text, sources = null) {
    // 1. CREAR EL CHAT SI NO EXISTE
    if (!chatHistory[id]) {
        let cleanText = text.replace(/<[^>]*>/g, '');
        let title = cleanText.length > 30 ? cleanText.substring(0, 30) + "..." : cleanText;
        if (sender === 'bot') title = "Nueva consulta";
        
        chatHistory[id] = { 
            title: title, 
            timestamp: Date.now(), 
            messages: [] 
        };
    }

    // 2. ACTUALIZAR TÍTULO (Solo si es el primer mensaje del usuario)
    if (sender === 'user' && chatHistory[id].messages.length === 0) {
        let cleanText = text.replace(/<[^>]*>/g, '');
        chatHistory[id].title = cleanText.length > 25 ? cleanText.substring(0, 25) + "..." : cleanText;
    }

    // 3. AÑADIR MENSAJE
    chatHistory[id].messages.push({ sender, text, sources: sources });
    chatHistory[id].timestamp = Date.now(); // Actualizar fecha para saber cuál es el más reciente


    // A. Recortar mensajes antiguos de ESTE chat actual
    if (chatHistory[id].messages.length > MAX_MENSAJES_POR_CHAT) {
        // Mantenemos solo los últimos X mensajes (slice negativo coge desde el final)
        chatHistory[id].messages = chatHistory[id].messages.slice(-MAX_MENSAJES_POR_CHAT);
    }

    // B. Recortar chats antiguos si hay demasiados
    const allChatIds = Object.keys(chatHistory);
    if (allChatIds.length > MAX_CHATS_GUARDADOS) {
        // Ordenamos por antigüedad (el más viejo primero)
        const sortedIds = allChatIds.sort((a, b) => chatHistory[a].timestamp - chatHistory[b].timestamp);

        // Borramos los sobrantes (la diferencia entre los que hay y el máximo)
        const toDelete = sortedIds.slice(0, allChatIds.length - MAX_CHATS_GUARDADOS);
        toDelete.forEach(delId => delete chatHistory[delId]);

        // Avisar al usuario para que sepa que se ha perdido un chat antiguo
        if (toDelete.length > 0 && typeof showToast === 'function') {
            showToast(`Se ha eliminado tu chat más antiguo para hacer sitio (máx ${MAX_CHATS_GUARDADOS})`, 'info', 4000);
        }
    }

    // 4. GUARDAR CON SEGURIDAD (Try/Catch por si se llena el LocalStorage)
    try {
        localStorage.setItem('medicarama_history', JSON.stringify(chatHistory));
    } catch (e) {
        console.warn("LocalStorage lleno. Iniciando limpieza de emergencia...");
        
        // ESTRATEGIA DE EMERGENCIA: Borrar el chat más antiguo (que no sea el actual)
        const sortedIds = Object.keys(chatHistory).sort((a, b) => chatHistory[a].timestamp - chatHistory[b].timestamp);
        const oldestId = sortedIds.find(oldId => oldId !== id); // No borramos el que estamos usando
        
        if (oldestId) {
            delete chatHistory[oldestId];
            // Reintentar guardar (Recursividad controlada)
            try {
                localStorage.setItem('medicarama_history', JSON.stringify(chatHistory));
            } catch (retryError) {
                console.error("No se pudo liberar espacio. El historial no se guardará.", retryError);
            }
        }
    }

    // 5. ACTUALIZAR UI
    renderHistorySidebar();
}

async function syncBackendMemory(messages) {
    try {
        const auth = await authHeaders();
        // Si aún no hay token (Firebase Auth restaura la sesión de forma asíncrona
        // tras DOMContentLoaded), salimos en silencio. La sincronización se reintentará
        // cuando auth.js emita el evento 'authReady'.
        if (!auth.Authorization) return;
        await fetch(MEMORY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...auth },
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
    if(loaderText) loaderText.innerText = "Redactando apuntes...";
    
    document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));

    try {
        // Limpiamos HTML del texto antes de enviar al PDF
        const messagePayload = chat.messages.map(m => ({ 
            role: m.sender, 
            text: m.text.replace(/<[^>]*>/g, '') 
        }));
        
        const auth = await authHeaders();
        const response = await fetch("/generate_pdf_file", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...auth },
            body: JSON.stringify({ messages: messagePayload })
        });

        if (!response.ok) throw new Error("Error del servidor: " + response.status);

        if(loaderText) loaderText.innerText = "Descargando...";

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
        showToast('Apuntes PDF descargados', 'success');

    } catch (error) {
        console.error("Error en JS:", error);
        showToast('Error al exportar PDF', 'error');
    } finally {
        setTimeout(() => { if(loader) loader.classList.remove('active'); }, 500);
    }
}

// --- UI SIDEBAR ---
function renderHistorySidebar() {
    const list = document.getElementById("history-list");
    list.innerHTML = '';
    const sortedIds = Object.keys(chatHistory).sort((a,b) => chatHistory[b].timestamp - chatHistory[a].timestamp);

    // Estado vacío: mensaje sutil cuando no hay chats
    if (sortedIds.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'history-empty';
        empty.innerHTML = `
            <div class="history-empty-icon">${ICONS.messageSquare}</div>
            <div class="history-empty-text">Aún no tienes conversaciones.<br>Empieza chateando.</div>
        `;
        list.appendChild(empty);
        return;
    }

    sortedIds.forEach(id => {
        const li = document.createElement("li");
        li.className = `history-item ${id === currentChatId ? 'active' : ''}`;
        li.innerHTML = `
            <button class="chat-title-btn" onclick="loadChatFromHistory('${id}')">${chatHistory[id].title}</button>
            <button class="options-btn" onclick="toggleDropdown(event, '${id}')" title="Opciones" aria-label="Opciones">⋮</button>
            <div class="dropdown-menu" id="dropdown-${id}">
                <button class="dropdown-item" onclick="renameChat('${id}')">Renombrar</button>
                <button class="dropdown-item" onclick="exportChatToPDF('${id}')">Exportar PDF</button>
                <button class="dropdown-item delete" onclick="deleteChat('${id}')">Borrar</button>
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
        showToast('Chat borrado', 'success');
    }
}

function clearAllHistory() {
    if (confirm("¿Borrar TODOS los chats?")) {
        const count = Object.keys(chatHistory).length;
        localStorage.removeItem('medicarama_history');
        chatHistory = {};
        renderHistorySidebar();
        startNewChatUI();
        showToast(`${count} ${count === 1 ? 'chat borrado' : 'chats borrados'}`, 'success');
    }
}

function renameChat(id) {
    const chat = chatHistory[id];
    if (!chat) return;
    const newTitle = prompt('Nuevo título para el chat:', chat.title);
    if (newTitle && newTitle.trim() && newTitle.trim() !== chat.title) {
        chat.title = newTitle.trim().substring(0, 50);
        localStorage.setItem('medicarama_history', JSON.stringify(chatHistory));
        renderHistorySidebar();
        showToast('Chat renombrado', 'success');
    }
}

// --- MICROFONO (Web Speech API; solo Chrome/Edge tienen webkitSpeechRecognition) ---
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
} else {
    // Ocultar el botón en navegadores sin soporte (Firefox, Safari < 14, etc.)
    // para evitar que el usuario lo pulse y no pase nada.
    document.addEventListener('DOMContentLoaded', () => {
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) micBtn.style.display = 'none';
    });
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

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    // Persistir preferencia en localStorage para que sobreviva a recargas y logout
    try {
        localStorage.setItem('medicarama_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    } catch (e) { /* localStorage puede estar lleno o desactivado, ignorar */ }
}

function loadSavedTheme() {
    try {
        if (localStorage.getItem('medicarama_theme') === 'dark') {
            document.body.classList.add('dark-mode');
        }
    } catch (e) {}
}
// Aplicamos lo antes posible (antes incluso de DOMContentLoaded para evitar flash)
loadSavedTheme();
function autoResize(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 150) + 'px'; }

function handleEnter(e) { 
    if (e.key === "Enter" && !e.shiftKey) { 
        e.preventDefault(); 
        if (!isGenerating) sendMessage(); // Respetar semáforo
    } 
}