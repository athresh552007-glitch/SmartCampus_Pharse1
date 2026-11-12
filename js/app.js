const response = await fetch('https://YOUR-BACKEND-HOST/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: clean,
    college: collegeSelect.value,
    language: languageSelect.value
  })
});

if (!response.ok) throw new Error('The assistant could not respond.');
const data = await response.json();
addMessage(data.answer, 'bot');
const messages = document.getElementById('messages');
const form = document.getElementById('chatForm');
const input = document.getElementById('messageInput');
const collegeSelect = document.getElementById('collegeSelect');
const languageSelect = document.getElementById('languageSelect');
let isSending = false;

function addMessage(text, type) {
  const row = document.createElement('div');
  row.className = `message ${type === 'user' ? 'user-message' : 'bot-message'}`;
  if (type === 'bot') {
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '✧';
    row.appendChild(avatar);
  }
  const wrap = document.createElement('div');
  wrap.className = 'bubble-wrap';
  const sender = document.createElement('span');
  sender.className = 'sender';
  sender.textContent = type === 'user' ? 'YOU' : 'SMARTCAMPUS AI';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  const time = document.createElement('span');
  time.className = 'time';
  time.textContent = 'Just now';
  wrap.append(sender, bubble, time);
  row.appendChild(wrap);
  messages.appendChild(row);
  messages.scrollTop = messages.scrollHeight;
  return row;
}

async function sendQuestion(question) {
  const clean = question.trim();
  if (!clean || isSending) return;

  isSending = true;
  addMessage(clean, 'user');
  input.value = '';
  input.disabled = true;
  form.querySelector('button[type="submit"]').disabled = true;
  const pendingMessage = addMessage('Thinking...', 'bot');
  const replyBubble = pendingMessage.querySelector('.bubble');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: clean,
        college: collegeSelect.value,
        language: languageSelect.value
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'The assistant could not respond.');
    }
    if (typeof data.answer !== 'string' || !data.answer.trim()) {
      throw new Error('The assistant returned an invalid response.');
    }
    replyBubble.textContent = data.answer;
  } catch (error) {
    console.error('Chat request failed:', error);
    replyBubble.textContent = 'Sorry, I could not reach the assistant. Please try again in a moment.';
  } finally {
    isSending = false;
    input.disabled = false;
    form.querySelector('button[type="submit"]').disabled = false;
    input.focus();
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  sendQuestion(input.value);
});
document.querySelectorAll('.suggestion, .service-item').forEach(button => {
  button.addEventListener('click', () => sendQuestion(button.dataset.prompt || button.textContent));
});
document.getElementById('newChatBtn').addEventListener('click', () => {
  messages.innerHTML = '<div class="message bot-message"><div class="message-avatar">✧</div><div class="bubble-wrap"><span class="sender">SMARTCAMPUS AI</span><div class="bubble">New conversation started! What would you like to know?</div><span class="time">Just now</span></div></div>';
});
document.getElementById('menuBtn').addEventListener('click', () => document.body.classList.toggle('menu-open'));

const voiceBtn = document.getElementById('voiceBtn');
voiceBtn.addEventListener('click', () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addMessage('Voice input is not supported in this browser. Try the latest Google Chrome.', 'bot');
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = languageSelect.value;
  recognition.interimResults = false;
  recognition.onresult = event => {
    input.value = event.results[0][0].transcript;
    input.focus();
  };
  recognition.onerror = () => addMessage('I could not capture your voice. Please try again or type your question.', 'bot');
  recognition.start();
});
