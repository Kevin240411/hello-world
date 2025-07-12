// Elementos del DOM
const chatContainer = document.getElementById('chat-container');
const textInput = document.getElementById('text-input');
const speakTextBtn = document.getElementById('speak-text-btn');
const startListeningBtn = document.getElementById('start-listening-btn');
const stopListeningBtn = document.getElementById('stop-listening-btn');
const fileInput = document.getElementById('file-input');

// Configuración de síntesis de voz
const synth = window.speechSynthesis;
let recognition;

// Configurar reconocimiento de voz
function setupRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
        startListeningBtn.disabled = true;
        stopListeningBtn.disabled = false;
        addMessage("Sistema", "Escuchando...", "bot");
    };

    recognition.onend = () => {
        startListeningBtn.disabled = false;
        stopListeningBtn.disabled = true;
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        addMessage("Tú", transcript, "user");
        processUserInput(transcript);
    };

    recognition.onerror = (event) => {
        addMessage("Sistema", `Error: ${event.error}`, "bot");
    };
}

// Añadir mensaje al chat
function addMessage(sender, message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(`${type}-message`);
    messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Procesar entrada del usuario
function processUserInput(input) {
    // Aquí puedes añadir lógica para responder al usuario
    const response = `Recibí: "${input}"`;
    speak(response);
    addMessage("Asistente", response, "bot");
}

// Leer texto en voz alta
function speak(text) {
    if (synth.speaking) {
        synth.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1;
    utterance.pitch = 1;
    
    utterance.onstart = () => {
        speakTextBtn.disabled = true;
    };
    
    utterance.onend = () => {
        speakTextBtn.disabled = false;
    };
    
    synth.speak(utterance);
}

// Leer archivo de texto
function readTextFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        textInput.value = content;
        speak(content);
        addMessage("Sistema", "Documento cargado y leído", "bot");
    };
    reader.readAsText(file);
}

// Leer PDF (
async function readPDFFile(file) {
    addMessage("Sistema", "Leyendo PDF... Esto puede tomar un momento", "bot");
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        
        // Limitar a las primeras 5 páginas para no sobrecargar
        const pageLimit = Math.min(5, pdf.numPages);
        
        for (let i = 1; i <= pageLimit; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const text = textContent.items.map(item => item.str).join(' ');
            fullText += text + '\n';
            
            // Actualizar progreso
            addMessage("Sistema", `Procesando página ${i} de ${pageLimit}...`, "bot");
        }
        
        textInput.value = fullText;
        speak(fullText.substring(0, 1000)); // Limitar para no sobrecargar
        addMessage("Sistema", `PDF leído (${pageLimit} páginas procesadas)`, "bot");
    } catch (error) {
        addMessage("Sistema", `Error al leer PDF: ${error.message}`, "bot");
        console.error("PDF Error:", error);
    }
}

// Event Listeners
speakTextBtn.addEventListener('click', () => {
    if (textInput.value.trim()) {
        addMessage("Tú", textInput.value, "user");
        speak(textInput.value);
    }
});

startListeningBtn.addEventListener('click', () => {
    if (!recognition) setupRecognition();
    recognition.start();
});

stopListeningBtn.addEventListener('click', () => {
    if (recognition) recognition.stop();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    addMessage("Sistema", `Archivo cargado: ${file.name}`, "bot");
    
    if (file.type === "application/pdf") {
        readPDFFile(file).catch(err => {
            addMessage("Sistema", `Error al leer PDF: ${err.message}`, "bot");
        });
    } else {
        readTextFile(file);
    }
});

// Mensaje inicial
addMessage("Sistema", "Hola! Puedes escribir texto, cargar un archivo o hablar conmigo.", "bot");