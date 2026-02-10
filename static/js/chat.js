const chatMessages = document.getElementById("chat-messages");
const messageInput = document.getElementById("message-input");
const btnSend = document.getElementById("btn-send");
const btnAttach = document.getElementById("btn-attach");
const btnMic = document.getElementById("btn-mic");
const btnNewSession = document.getElementById("btn-new-session");
const fileInput = document.getElementById("file-input");
const filePreview = document.getElementById("file-preview");
const filePreviewItems = document.getElementById("file-preview-items");
const statusDot = document.querySelector(".status-dot");
const statusText = document.getElementById("status-text");

let pendingFiles = [];
let isProcessing = false;
let recognition = null;
let isRecording = false;

function init() {
    fetch("/api/session").then(r => r.json());
    setupSpeechRecognition();
    setupPasteHandler();
    setupDragDrop();
    autoResizeTextarea();
}

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        btnMic.style.display = "none";
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        if (finalTranscript) {
            const current = messageInput.value;
            messageInput.value = current + (current ? " " : "") + finalTranscript;
            autoResizeTextarea();
        }
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        stopRecording();
    };

    recognition.onend = () => {
        if (isRecording) {
            stopRecording();
        }
    };
}

function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    if (!recognition) return;
    try {
        recognition.start();
        isRecording = true;
        btnMic.classList.add("recording");
        setStatus("Listening...", "processing");
    } catch (e) {
        console.error("Could not start recording:", e);
    }
}

function stopRecording() {
    if (!recognition) return;
    try {
        recognition.stop();
    } catch (e) {}
    isRecording = false;
    btnMic.classList.remove("recording");
    if (!isProcessing) {
        setStatus("Ready", "ready");
    }
}

function setupPasteHandler() {
    messageInput.addEventListener("paste", (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    addFile(file);
                }
            }
        }
    });
}

function setupDragDrop() {
    const app = document.getElementById("chat-app");

    app.addEventListener("dragover", (e) => {
        e.preventDefault();
        app.style.outline = "2px dashed var(--accent)";
        app.style.outlineOffset = "-4px";
    });

    app.addEventListener("dragleave", (e) => {
        e.preventDefault();
        app.style.outline = "none";
    });

    app.addEventListener("drop", (e) => {
        e.preventDefault();
        app.style.outline = "none";
        const files = e.dataTransfer?.files;
        if (files) {
            for (const file of files) {
                addFile(file);
            }
        }
    });
}

function autoResizeTextarea() {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + "px";
}

function addFile(file) {
    pendingFiles.push(file);
    renderFilePreview();
}

function removeFile(index) {
    pendingFiles.splice(index, 1);
    renderFilePreview();
}

function renderFilePreview() {
    if (pendingFiles.length === 0) {
        filePreview.classList.add("hidden");
        return;
    }

    filePreview.classList.remove("hidden");
    filePreviewItems.innerHTML = "";

    pendingFiles.forEach((file, index) => {
        const item = document.createElement("div");
        item.className = "file-preview-item";

        const isImage = file.type.startsWith("image/");

        if (isImage) {
            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            item.appendChild(img);
        } else {
            const icon = document.createElement("div");
            icon.className = "file-icon";
            icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`;
            item.appendChild(icon);
        }

        const name = document.createElement("span");
        name.textContent = file.name.length > 20 ? file.name.substring(0, 17) + "..." : file.name;
        item.appendChild(name);

        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-file";
        removeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
        removeBtn.onclick = () => removeFile(index);
        item.appendChild(removeBtn);

        filePreviewItems.appendChild(item);
    });
}

function setStatus(text, state) {
    statusText.textContent = text;
    statusDot.className = "status-dot";
    if (state === "processing") statusDot.classList.add("processing");
    if (state === "error") statusDot.classList.add("error");
}

function addMessage(role, content, media = [], attachments = []) {
    const welcome = chatMessages.querySelector(".welcome-message");
    if (welcome) welcome.remove();

    const msg = document.createElement("div");
    msg.className = `message ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = role === "user"
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    if (attachments.length > 0) {
        const attachDiv = document.createElement("div");
        attachDiv.className = "message-attachments";
        attachments.forEach(att => {
            const badge = document.createElement("div");
            badge.className = "attachment-badge";
            if (att.type === "image") {
                const img = document.createElement("img");
                img.src = att.preview;
                img.style.width = "100px";
                img.style.height = "auto";
                img.style.borderRadius = "4px";
                img.style.cursor = "pointer";
                img.onclick = () => showImageModal(att.preview);
                attachDiv.appendChild(img);
            } else {
                badge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>${att.name}`;
                attachDiv.appendChild(badge);
            }
        });
        contentDiv.appendChild(attachDiv);
    }

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (role === "user") {
        bubble.textContent = content;
    } else {
        bubble.innerHTML = content;
    }

    contentDiv.appendChild(bubble);

    if (media.length > 0) {
        const mediaDiv = document.createElement("div");
        mediaDiv.className = "message-media";
        media.forEach(m => {
            if (m.type === "image" && m.url) {
                const img = document.createElement("img");
                img.src = m.url;
                img.alt = m.name || "Image";
                img.loading = "lazy";
                img.onclick = () => showImageModal(m.url);
                img.onerror = () => {
                    img.style.display = "none";
                };
                mediaDiv.appendChild(img);
            }
        });
        contentDiv.appendChild(mediaDiv);
    }

    msg.appendChild(avatar);
    msg.appendChild(contentDiv);
    chatMessages.appendChild(msg);
    scrollToBottom();
}

function showTypingIndicator() {
    const welcome = chatMessages.querySelector(".welcome-message");
    if (welcome) welcome.remove();

    const msg = document.createElement("div");
    msg.className = "message assistant";
    msg.id = "typing-indicator";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    const typing = document.createElement("div");
    typing.className = "typing-indicator";
    typing.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;

    contentDiv.appendChild(typing);
    msg.appendChild(avatar);
    msg.appendChild(contentDiv);
    chatMessages.appendChild(msg);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) indicator.remove();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showImageModal(src) {
    const modal = document.createElement("div");
    modal.className = "image-modal";
    modal.innerHTML = `<img src="${src}" alt="Full size image">`;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message && pendingFiles.length === 0) return;
    if (isProcessing) return;

    isProcessing = true;
    setStatus("Processing...", "processing");
    btnSend.disabled = true;

    const userAttachments = pendingFiles.map(f => ({
        name: f.name,
        type: f.type.startsWith("image/") ? "image" : "document",
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
    }));

    addMessage("user", message || "Sent attachments", [], userAttachments);

    const formData = new FormData();
    formData.append("message", message);
    pendingFiles.forEach(f => formData.append("files", f));

    messageInput.value = "";
    pendingFiles = [];
    renderFilePreview();
    autoResizeTextarea();

    showTypingIndicator();

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            body: formData,
        });

        removeTypingIndicator();

        const data = await response.json();

        if (!response.ok) {
            addMessage("assistant", `<div class="error-message">${data.error || "Something went wrong"}</div>`);
            setStatus("Error", "error");
        } else {
            const { text, media } = data.response;
            addMessage("assistant", text || "No response received", media || []);
            setStatus("Ready", "ready");
        }
    } catch (error) {
        removeTypingIndicator();
        addMessage("assistant", `<div class="error-message">Network error. Please check your connection and try again.</div>`);
        setStatus("Error", "error");
    }

    isProcessing = false;
    btnSend.disabled = false;
}

messageInput.addEventListener("input", autoResizeTextarea);

messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

btnSend.addEventListener("click", sendMessage);

btnAttach.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
    for (const file of e.target.files) {
        addFile(file);
    }
    fileInput.value = "";
});

btnMic.addEventListener("click", toggleRecording);

btnNewSession.addEventListener("click", async () => {
    await fetch("/api/session/reset", { method: "POST" });
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 8V4H8"/>
                    <rect width="16" height="12" x="4" y="8" rx="2"/>
                    <path d="M2 14h2"/><path d="M20 14h2"/>
                    <path d="M15 13v2"/><path d="M9 13v2"/>
                </svg>
            </div>
            <h2>Welcome!</h2>
            <p>Start a conversation with your n8n agent. You can send text, paste images, attach documents, or use the microphone.</p>
        </div>
    `;
    setStatus("Ready", "ready");
});

init();
