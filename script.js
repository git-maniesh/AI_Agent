



const API_KEY = "AIzaSyDUSeK0ojUgFBuV98ddwRXwaKzNWJpv6Og";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input"); // textarea
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggle = document.querySelector("#theme-toggle-btn");

const userData = { message: "", file: {} };
const chatHistory = [];
fileUploadWrapper.classList.remove("active", "image-attached", "file-attached");

let typingInterval, controller;

// Scroll to bottom of the container
const scrollToBottom = () =>
  chatsContainer.scrollTo({
    top: chatsContainer.scrollHeight,
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

// Generate response (placeholder for now)
const generateResponse = async (botMsgDiv) => {
  // Implement your API fetch here
  // For now, simulate a bot reply
  const botMessage = botMsgDiv.querySelector(".message-text");
  setTimeout(() => {
    typingEffect("Hey there! This is a simulated response.", botMessage, botMsgDiv);
  }, 1000);
};

// Handle form submission
const handleFormSubmit = (e) => {
  e.preventDefault();

  const userMessage = promptInput.value.trim();
  if (!userMessage || document.body.classList.contains("bot-responding")) return;

  // Clear prompt once message is added
  promptInput.value = "";
  promptInput.style.height = "auto"; // reset height after send
  userData.message = userMessage;

  document.body.classList.add("bot-responding", "chats-active");
  fileUploadWrapper.classList.remove("active", "image-attached", "file-attached");

  // User message
  const userMsgHTML = `
    <p class="message-text"></p>
    ${
      userData.file.data
        ? userData.file.isImage
          ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />`
          : `<p class="file-attachment"><span class="material-symbols-rounded">description</span> ${userData.file.fileName}</p>`
        : ""
    }`;

  const userMsgDiv = createMsgElement(userMsgHTML, "user-message");
  userMsgDiv.querySelector(".message-text").textContent = userMessage;
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  // Simulate bot typing
  setTimeout(() => {
    const botMsgHTML = `
      <img src="gemini2.png" class="avatar">
      <p class="message-text">Just a sec...</p>`;
    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);

    generateResponse(botMsgDiv);
  }, 600);
};

// Handle file input
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
  chatsContainer.querySelector(".bot-message.loading")?.classList.remove("loading");
  document.body.classList.remove("bot-responding");
});

// Delete chats
document.querySelector("#delete-chats-btn").addEventListener("click", () => {
  chatHistory.length = 0;
  chatsContainer.innerHTML = "";
  document.body.classList.remove("bot-responding", "chats-active");
});

// Show/hide mobile controls
document.addEventListener("click", ({ target }) => {
  const wrapper = document.querySelector(".prompt-wrapper");
  const shouldHide =
    target.classList.contains(".prompt-input") ||
    (wrapper.classList.contains("hide-controls") &&
      (target.id === "add-file-btn" || target.id === "stop-response-btn"));
  wrapper.classList.toggle("hide-controls", shouldHide);
});

// Theme toggle
themeToggle.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
  themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
});

// Set initial theme
const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";

// Suggestion click handler
document.querySelectorAll(".suggestions-item").forEach((item) => {
  item.addEventListener("click", () => {
    promptInput.value = item.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
  });
});

// Attach listeners
promptForm.addEventListener("submit", handleFormSubmit);
promptForm.querySelector("#add-file-btn").addEventListener("click", () => fileInput.click());

// 🧩 NEW — multiline input behavior
promptInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    promptForm.dispatchEvent(new Event("submit"));
  }
});

// 🧩 Auto-resize input box
promptInput.addEventListener("input", () => {
  promptInput.style.height = "auto";
  promptInput.style.height = promptInput.scrollHeight + "px";
});


