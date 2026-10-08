let currentThreadId = localStorage.getItem("travel_thread_id") || null;
let latestAnswerMarkdown = "";

function setPrompt(text) {
    document.getElementById("userInput").value = text;
}

function setLoading(isLoading) {
    const sendBtn = document.getElementById("sendBtn");
    const btnText = document.getElementById("btnText");
    const btnLoader = document.getElementById("btnLoader");

    sendBtn.disabled = isLoading;

    if (isLoading) {
        btnText.classList.add("hidden");
        btnLoader.classList.remove("hidden");
    } else {
        btnText.classList.remove("hidden");
        btnLoader.classList.add("hidden");
    }
}

function showError(message) {
    const errorBox = document.getElementById("errorBox");

    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}

function hideError() {
    const errorBox = document.getElementById("errorBox");

    errorBox.classList.add("hidden");
    errorBox.textContent = "";
}

function showResult(answer, threadId) {
    latestAnswerMarkdown = answer;

    const resultSection = document.getElementById("resultSection");
    const resultBox = document.getElementById("resultBox");
    const threadInfo = document.getElementById("threadInfo");

    if (typeof marked !== "undefined") {
        resultBox.innerHTML = marked.parse(answer);
    } else {
        resultBox.innerText = answer;
    }

    threadInfo.textContent = `Thread ID: ${threadId}`;

    resultSection.classList.remove("hidden");

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function sendMessage() {
    hideError();

    const input = document.getElementById("userInput");
    const message = input.value.trim();

    if (!message) {
        showError("Please enter your travel request first.");
        return;
    }

    setLoading(true);

    try {
        const response = await fetch("/api/travel", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                thread_id: currentThreadId
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || "Something went wrong.");
        }

        currentThreadId = data.thread_id;
        localStorage.setItem("travel_thread_id", currentThreadId);

        showResult(data.answer, data.thread_id);

    } catch (error) {
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

function copyResult() {
    const resultBox = document.getElementById("resultBox");
    const text = resultBox.innerText;

    if (!text) {
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => {
            const copyBtn = document.querySelector(".copy-btn");
            const oldText = copyBtn.textContent;

            copyBtn.textContent = "Copied!";

            setTimeout(() => {
                copyBtn.textContent = oldText;
            }, 1400);
        })
        .catch(() => {
            showError("Could not copy result.");
        });
}

async function downloadPDF() {
    const pdfContent = document.getElementById("pdfContent");

    if (!latestAnswerMarkdown || !pdfContent) {
        showError("No travel plan available to download.");
        return;
    }

    const downloadBtn = document.querySelector(".download-btn");
    const oldText = downloadBtn.textContent;

    downloadBtn.textContent = "Preparing PDF...";
    downloadBtn.disabled = true;

    try {
        const canvas = await html2canvas(pdfContent, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            onclone: (clonedDocument) => {
                const clonedSection = clonedDocument.getElementById("resultSection");
                const clonedPdfContent = clonedDocument.getElementById("pdfContent");

                if (!clonedSection || !clonedPdfContent) {
                    throw new Error("Could not prepare travel plan for PDF.");
                }

                [clonedSection, ...clonedSection.querySelectorAll("*")].forEach((element) => {
                    element.style.setProperty("animation", "none", "important");
                    element.style.setProperty("transition", "none", "important");
                    element.style.setProperty("opacity", "1", "important");
                    element.style.setProperty("visibility", "visible", "important");
                });

                const clonedTitle = clonedPdfContent.querySelector(".pdf-title");
                if (!clonedTitle) {
                    throw new Error("Could not prepare travel plan title for PDF.");
                }
                clonedTitle.style.display = "block";
                clonedPdfContent.style.overflow = "visible";
            }
        });

        await html2pdf()
            .set({
                margin: 0.5,
                filename: "ai-travel-plan.pdf",
                image: {
                    type: "jpeg",
                    quality: 0.98
                },
                jsPDF: {
                    unit: "in",
                    format: "a4",
                    orientation: "portrait"
                }
            })
            .from(canvas, "canvas")
            .save();
    } catch {
        showError("Could not download PDF.");
    } finally {
        downloadBtn.textContent = oldText;
        downloadBtn.disabled = false;
    }
}

document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === "Enter") {
        sendMessage();
    }
});