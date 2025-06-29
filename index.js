// index.js for Interactive Poem Generator

let messageHistory = {
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content: `
        You are a poetic assistant. Write a single poetic verse in response to each prompt. 
        Do not include the prompt in the response. Use json. The verses should relate to each other, but dont repeat verses. Dont use commas or periods at the end of a verse.
      `,
    },
  ],
};

const apiEndpoint = 'https://lianageo--2fae5f5953854a7a93380424561eeddc.web.val.run';
if (!apiEndpoint.includes('run')) {
  throw new Error('Please use your own val.town endpoint!!!');
}

const MAX_HISTORY_LENGTH = 20;

function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

function truncateHistory(history) {
  if (!history || !history.messages || history.messages.length <= 1) {
    return history;
  }
  const [system, ...rest] = history.messages;
  if (rest.length > MAX_HISTORY_LENGTH) {
    return { ...history, messages: [system, ...rest.slice(-MAX_HISTORY_LENGTH)] };
  }
  return history;
}

function appendVerse(verse) {
  const poemDisplay = document.querySelector(".poem-display");
  if (!poemDisplay) return;

  const verseElement = document.createElement("div");
  verseElement.classList.add("verse");
  verseElement.textContent = "";
  poemDisplay.appendChild(verseElement);

  // Typewriter effect
  let i = 0;
  const interval = setInterval(() => {
    verseElement.textContent += verse.charAt(i);
    i++;
    if (i >= verse.length) clearInterval(interval);
    scrollToBottom(poemDisplay);
  }, 30);
}

async function sendPrompt(promptText) {
  if (!promptText) return;
  const poemDisplay = document.querySelector(".poem-display");
  if (!poemDisplay) return;

  messageHistory.messages.push({ role: "user", content: promptText });
  messageHistory = truncateHistory(messageHistory);

  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(messageHistory),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(errorText);
    return;
  }

  const json = await response.json();
  let newLine = json.completion.choices[0].message.content.trim();

  // Try to parse out unwanted JSON keys if still present
  try {
    const parsed = JSON.parse(newLine);
    if (typeof parsed === "object") {
      const values = Object.values(parsed);
      if (values.length > 0 && typeof values[0] === "string") {
        newLine = values[0];
      }
    }
  } catch (e) {
    // Not JSON, keep as-is
  }

  messageHistory.messages.push({ role: "assistant", content: newLine });
  appendVerse(newLine);
}

// Setup
window.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const input = document.querySelector("input[name='content']");
  const colorButtons = document.querySelectorAll(".color-buttons button");

  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = input.value.trim();
    if (!value) return;
    sendPrompt(value);
    input.value = "";
  });

  colorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const color = button.getAttribute("data-color");
      if (color) sendPrompt(color);
    });
  });
});
