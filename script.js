// const API_KEY = "AIzaSyDYg2l1LGTwVW-HQKEQJFWcsOvzLfaBd2c"
// const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`

const API_KEY = "AIzaSyA0AncRNGAQ9m7gZE8zz82PbbCmAF7e5uM";
// const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;


/* -------------------------------------------------------------------------
   IMPORTANT: 
   1. Get a NEW API KEY from https://aistudio.google.com/ (Old one was exposed).
   2. Ensure 'gemini-2.5-flash' is available in your account. 
      If it fails, use 'gemini-2.0-flash-exp' or 'gemini-1.5-flash-002'.
   ------------------------------------------------------------------------- */

// const API_KEY = "YOUR_NEW_API_KEY_HERE"; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggle = document.querySelector("#theme-toggle-btn");

// Select the textarea
const textarea = document.querySelector(".prompt-input");

// Auto-resize textarea as user types
textarea.addEventListener("input", () => {
  textarea.style.height = "auto"; 
  textarea.style.height = textarea.scrollHeight + "px"; 
});

// Allow Shift+Enter for new line, Enter to send
textarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); 
    document.getElementById("send-prompt-btn").click(); 
  }
});

const userData = { message: "", file: {} };
const chatHistory = [];
fileUploadWrapper.classList.remove("active", "image-attached", "file-attached");
let typingInterval, controller;

// Scroll to bottom
const scrollToBottom = () =>
  container.scrollTo({
    top: container.scrollHeight,
    behavior: "smooth",
  });

// Create message element
const createMsgElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Typing effect
const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;

  typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
    }
  }, 40);
};

// Generate Bot Response
const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();

  // Prepare chat history for API
  // Note: Gemini 1.5/2.0+ handles inline_data for images well
  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data
        ? [
            {
              inline_data: {
                mime_type: userData.file.mime_type,
                data: userData.file.data
              },
            },
          ]
        : []),
    ],
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
      signal: controller.signal,
    });
    
    const data = await response.json();

    // Check for API errors specifically
    if (!response.ok) {
        throw new Error(data.error?.message || `API Error: ${response.statusText}`);
    }

    // Process response
    const responseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Simple markdown bold removal
      .trim();

    typingEffect(responseText, textElement, botMsgDiv);

    chatHistory.push({
      role: "model",
      parts: [{ text: responseText }],
    });

  } catch (error) {
    textElement.style.color = "#d62939";
    textElement.textContent = error.name === "AbortError"
        ? "Response generation stopped"
        : `Error: ${error.message}`;
        
    // Helpful debugging for 404s
    if (error.message.includes("404") || error.message.includes("not found")) {
         textElement.textContent += " (Check if 'gemini-2.5-flash' is valid for your API key)";
    }

    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
    scrollToBottom();
  } finally {
    userData.file = {};
  }
};

// Handle form Submission
const handleFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage || document.body.classList.contains("bot-responding"))
    return;

  promptInput.value = "";
  userData.message = userMessage;
  document.body.classList.add("bot-responding", "chats-active");
  fileUploadWrapper.classList.remove("active", "image-attached", "file-attached");

  textarea.value = "";
  textarea.style.height = "auto";
  textarea.rows = 1;

  // Fixed the HTML quote bug below (class="img-attachment")
  const userMsgHTML = `
    <p class="message-text"></p>
    ${
      userData.file.data
        ? userData.file.isImage
          ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />`
          : `<p class="file-attachment"><span class="material-symbols-rounded">description</span> ${userData.file.fileName} </p>`
        : ""
    }`;

  const userMsgDiv = createMsgElement(userMsgHTML, "user-message");
  userMsgDiv.querySelector(".message-text").textContent = userMessage;
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  setTimeout(() => {
    const botMsgHTML = `<img src="gemini2.png" class="avatar"> <p class="message-text">Just a sec... </p>`;
    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    generateResponse(botMsgDiv);
  }, 600);
};

// Handle file input change
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (e) => {
    fileInput.value = "";
    const base64String = e.target.result.split(",")[1];
    fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
    fileUploadWrapper.classList.add("active", isImage ? "image-attached" : "file-attached");

    userData.file = {
      fileName: file.name,
      data: base64String,
      mime_type: file.type,
      isImage,
    };
  };
});

// Cancel file upload
document.querySelector("#cancel-file-btn").addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("active", "image-attached", "file-attached");
});

// Stop response button
document.querySelector("#stop-response-btn").addEventListener("click", () => {
  userData.file = {};
  controller?.abort();
  clearInterval(typingInterval);
  const loadingMsg = chatsContainer.querySelector(".bot-message.loading");
  if (loadingMsg) loadingMsg.classList.remove("loading");
  document.body.classList.remove("bot-responding");
});

// Delete chats button
document.querySelector("#delete-chats-btn").addEventListener("click", () => {
  chatHistory.length = 0;
  chatsContainer.innerHTML = "";
  document.body.classList.remove("bot-responding", "chats-active");
});

// Theme toggling
themeToggle.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
  themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
});

// Set initial theme
const initialTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", initialTheme);
themeToggle.textContent = initialTheme ? "dark_mode" : "light_mode";

// Suggestions items
document.querySelectorAll(".suggestions-item").forEach((item) => {
  item.addEventListener("click", () => {
    promptInput.value = item.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
  });
});

promptForm.addEventListener("submit", handleFormSubmit);
promptForm.querySelector("#add-file-btn").addEventListener("click", () => fileInput.click());
