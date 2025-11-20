// Query all needed elements
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

// State
let currentAgent = "male";
let personas = null;
let conversationHistory = [];

// Load personas from server
async function loadPersonas() {
  try {
    // TODO: Fetch personas from the backend by accessing the static personas.json
    // Then update `personas` with the fetched data.
    updateAgentDisplay();
  } catch (error) {
    console.error("Error loading personas:", error);
  }
}

// Update agent display based on selection
function updateAgentDisplay() {
  if (!personas) return;

  const agent = personas.find((a) => a.id === currentAgent);
  if (agent) {
    agentAvatarImg.src = agent.avatar;
    agentAvatarImg.alt = `${agent.name} Avatar`;
    agentName.textContent = agent.name;
  }
}

// Agent selection handler
agentRadios.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    if (e.target.checked) {
      currentAgent = e.target.value;
      updateAgentDisplay();
      // Clear conversation when switching agents
      conversationHistory = [];
      messageContainer.innerHTML = "";
    }
  });
});

// Add message to chat
function addMessage(text, sender) {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "msg own-message" : "msg other-message";
  msg.textContent = text;
  messageContainer.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  // Add to conversation history
  conversationHistory.push({ sender, text });
}

// Send message
async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  // Add user message
  addMessage(message, "user");
  chatInput.value = "";
  autoResizeTextarea();

  // Get response from agent
  try {
    // TODO: Send message using the chat API. When receive data, use `addMessage()` to populate the response text in the chat UI
  } catch (error) {
    // TODO: Error handling
  }
}

// Send button handler
sendBtn.addEventListener("click", sendMessage);

// Auto-resize textarea
function autoResizeTextarea() {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 150) + "px";
}

chatInput.addEventListener("input", autoResizeTextarea);

// Enter key handler (Shift+Enter for new line, Enter to send)
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

// AI Helper functionality
aiHelperBtn.addEventListener("click", async () => {
  // TODO: First, trim the input text.
  // If input text is empty, alert the user.

  try {
    // TODO: Call the /ai-helper API in the backend
    // When receive response, display the suggestions using `displaySuggestions()`
    // If no data, alert 'No suggestions available.'
    // Hint: To make sure the AI Helper Modal becomes visible, use `aiHelperModal.style.display = 'block'`
  } catch (error) {
    // If response error, alert 'Error getting suggestions. Please try again.' and log the error in console.
  }
});

// Display suggestions in modal
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

// Close modal
closeModal.addEventListener("click", () => {
  aiHelperModal.style.display = "none";
});

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  if (e.target === aiHelperModal) {
    aiHelperModal.style.display = "none";
  }
});

// Initialize
loadPersonas();
