// const API_KEY = "AIzaSyDYg2l1LGTwVW-HQKEQJFWcsOvzLfaBd2c"
// const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`

const API_KEY = "AIzaSyB4Dj9Sd9wmjcrKpKJibgMm-nAPAebJtDA";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}}`;

const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
// const textarea = document.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggle = document.querySelector("#theme-toggle-btn");

// Select the textarea
const textarea = document.querySelector(".prompt-input");

// Auto-resize textarea as user types
textarea.addEventListener("input", () => {
  textarea.style.height = "auto"; // reset height
  textarea.style.height = textarea.scrollHeight + "px"; // grow based on content
});

// Allow Shift+Enter for new line, Enter to send
textarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault(); // prevent new line
    document.getElementById("send-prompt-btn").click(); // trigger send
  }
});

// let userMessage = "";
const userData = { message: "", file: {} };

const chatHistory = [];
fileUploadWrapper.classList.remove("active", "image-attached", "file-attached");
let typingInterval, controller;
// scroll to bottom of the container
const scrollToBottom = () =>
  container.scrollTo({
    top: container.scrollHeight,
    behavior: "smooth",
  });

// function to create message element
const createMsgElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};
// typing effect
const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = "";
  const words = text.split(" ");

  let wordIndex = 0;
  // set an interval to type each word
  typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent +=
        (wordIndex === 0 ? "" : " ") + words[wordIndex++];

      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
    }
  }, 40);
};

// make an API call and generate the bot's response
const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();

  // Add user message and file data to the chat history
  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data
        ? [
            {
              inline_data: (({ fileName, isImage, ...rest }) => rest)(
                userData.file
              ),
            },
          ]
        : []),
    ],
  });

  try {
    // send the chat history to the api to get a response
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
      signal: controller.signal,
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error.message);

    // console.log(data)

    // process the response text and display it with typing effect
    const responseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .trim();

    // textElement.textContent = responseText

    typingEffect(responseText, textElement, botMsgDiv);

    chatHistory.push({
      role: "model",
      parts: [{ text: responseText }],
    });
    // console.log(chatHistory)
  } catch (error) {
    textElement.style.color = "#d62939";
    textElement.textContent =
      error.name === "AbortError"
        ? "Response generation stopped"
        : error.message;
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

  // clearing the prompt once the message is added to conversation
  promptInput.value = "";
  userData.message = userMessage;
  document.body.classList.add("bot-responding", "chats-active");
  fileUploadWrapper.classList.remove(
    "active",
    "image-attached",
    "file-attached"
  );

  // Reset textarea to original size
  textarea.value = "";
  textarea.style.height = "auto"; // resets to 1 line
  textarea.rows = 1;

//   console.log(userMessage);
  // Generate user message HTML and add in the chats container
  const userMsgHTML = `
    <p class= "message-text"> </p>
    ${
      userData.file.data
        ? userData.file.isImage
          ? `<img src = "data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment />`
          : `<p class="file-attachment"><span class="material-symbols-rounded">description</span> ${userData.file.fileName} </p>`
        : " "
    }`;

  const userMsgDiv = createMsgElement(userMsgHTML, "user-message");

  userMsgDiv.querySelector(".message-text").textContent = userMessage;
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  setTimeout(() => {
    // Generate user bots HTML and add in the chats container after 600ms
    const botMsgHTML = `<img src="gemini2.png" class="avatar"> <p class= "message-text">Just a sec... </p>`;
    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");

    chatsContainer.appendChild(botMsgDiv);

    // generate the bots response based on apis
    generateResponse(botMsgDiv);
  }, 600);
};
// Handle file input change fileUpload
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];

  if (!file) return;

  // console.log(file)
  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (e) => {
    fileInput.value = "";
    const base64String = e.target.result.split(",")[1];
    fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
    fileUploadWrapper.classList.add(
      "active",
      isImage ? "image-attached" : "file-attached"
    );

    // store file data in userData onj
    userData.file = {
      fileName: file.name,
      data: base64String,
      mime_type: file.type,
      isImage,
    };
  };
});
// cancel file upload
document.querySelector("#cancel-file-btn").addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove(
    "active",
    "image-attached",
    "file-attached"
  );
});

// stope  response button
document.querySelector("#stop-response-btn").addEventListener("click", () => {
  userData.file = {};
  controller?.abort();
  clearInterval(typingInterval);
  chatsContainer
    .querySelector(".bot-message.loading")
    .classList.remove("loading");
  document.body.classList.remove("bot-responding");
});

// delete chats button
document.querySelector("#delete-chats-btn").addEventListener("click", () => {
  chatHistory.length = 0;
  chatsContainer.innerHTML = "";
  document.body.classList.remove("bot-responding", "chats-active");
});

// show/hide the controls for mobile on prompt input focus
document.addEventListener("click", ({ target }) => {
  const wrapper = document.querySelector(".prompt-wrapper");
  const shouldHide =
    target.classList.contains(".prompt-input") ||
    (wrapper.classList.contains("hide-controls") &&
      (target.id === "add-file-btn" || target.id === "stop-response-btn"));
  wrapper.classList.toggle("hide-controls", shouldHide);
});

// theme toggling funcitonality dark and light theme
themeToggle.addEventListener("click", () => {
  const isLightTheme = document.body.classList.toggle("light-theme");
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode");
  themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";
});

// set initial theme from local storage
const isLightTheme = localStorage.getItem("themeColor") === "light_mode";
document.body.classList.toggle("light-theme", isLightTheme);
themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode";

// get response for the suggestions items

document.querySelectorAll(".suggestions-item").forEach((item) => {
  item.addEventListener("click", () => {
    promptInput.value = item.querySelector(".text").textContent;
    promptForm.dispatchEvent(new Event("submit"));
  });
});

promptForm.addEventListener("submit", handleFormSubmit);

promptForm
  .querySelector("#add-file-btn")
  .addEventListener("click", () => fileInput.click());







