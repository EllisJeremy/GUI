const chatInput = document.querySelector("#chatInput");
const sendBtn = document.querySelector("#sendBtn");
const aiHelperBtn = document.querySelector("#aiHelperBtn");
const messageContainer = document.querySelector("#messageContainer");
const chatBox = document.querySelector(".chatBox");
const agentAvatar = document.querySelector("#agentAvatar");
const agentAvatarImg = document.querySelector("#agentAvatarImg");
const agentName = document.querySelector("#agentName");
const agentRadios = document.querySelectorAll('input[name="agent"]');
const aiHelperModal = document.querySelector("#aiHelperModal");
const suggestionsContainer = document.querySelector("#suggestionsContainer");
const closeModal = document.querySelector(".close");

let currentAgent = "male";
let personas = null;
let conversationHistory = [];

async function loadPersonas() {
  try {
    const response = await fetch("/personas.json");
    if (!response.ok) {
      throw new Error("Failed to fetch personas");
    }
    const data = await response.json();
    personas = data.agents;
    updateAgentDisplay();
  } catch (error) {
    console.error("Error loading personas:", error);
  }
}

function updateAgentDisplay() {
  if (!personas) return;

  const agent = personas.find((a) => a.id === currentAgent);
  if (agent) {
    agentAvatarImg.src = agent.avatar;
    agentAvatarImg.alt = `${agent.name} Avatar`;
    agentName.textContent = agent.name;
  }
}

agentRadios.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    if (e.target.checked) {
      currentAgent = e.target.value;
      updateAgentDisplay();
      conversationHistory = [];
      messageContainer.innerHTML = "";
    }
  });
});

function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "msg own-message" : "msg other-message";
  msg.textContent = text;
  messageContainer.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  conversationHistory.push({ sender, text });
}

async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage(message, "user");
  chatInput.value = "";
  autoResizeTextarea();

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agentId: currentAgent,
        message: message,
        history: conversationHistory.slice(0, -1),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get response");
    }

    const data = await response.json();

    if (data.error) {
      addMessage("Sorry, I encountered an error. Please try again.", "agent");
    } else {
      addMessage(data.response, "agent");
    }
  } catch (error) {
    console.error("Error sending message:", error);
    addMessage("Sorry, I encountered an error. Please try again.", "agent");
  }
}

sendBtn.addEventListener("click", sendMessage);

function autoResizeTextarea() {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + "px";
}

chatInput.addEventListener("input", autoResizeTextarea);

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

aiHelperBtn.addEventListener("click", async () => {
  const message = chatInput.value.trim();

  if (!message) {
    alert("Please type a message first to get suggestions.");
    return;
  }

  try {
    const response = await fetch("/ai-helper", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        history: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get suggestions");
    }

    const data = await response.json();

    if (!data.suggestions || data.suggestions.length === 0) {
      alert("No suggestions available.");
      return;
    }

    displaySuggestions(data.suggestions);
    aiHelperModal.style.display = "block";
  } catch (error) {
    console.error("Error getting suggestions:", error);
    alert("Error getting suggestions. Please try again.");
  }
});

function displaySuggestions(suggestions) {
  suggestionsContainer.innerHTML = "";
  suggestions.forEach((suggestion, index) => {
    const suggestionDiv = document.createElement("div");
    suggestionDiv.className = "suggestion-item";
    suggestionDiv.textContent = suggestion;
    suggestionDiv.addEventListener("click", () => {
      chatInput.value = suggestion;
      autoResizeTextarea();
      aiHelperModal.style.display = "none";
      chatInput.focus();
    });
    suggestionsContainer.appendChild(suggestionDiv);
  });
}

closeModal.addEventListener("click", () => {
  aiHelperModal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === aiHelperModal) {
    aiHelperModal.style.display = "none";
  }
});

loadPersonas();
