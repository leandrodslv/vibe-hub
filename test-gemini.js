import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyB92QLf2TxnlM2qZg4uSGBUIpAJehi_G-U');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

const history = [
  { role: 'assistant', text: 'Bonjour ! Je suis...' },
  { role: 'user', text: 'salut' },
  { role: 'assistant', text: "Salut ! Je suis ravi de t'aider..." },
  { role: 'user', text: 'je cherche des idée de design' }
];

async function run() {
  try {
    const allMessages = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }],
    }));

    while (allMessages.length > 0 && allMessages[0].role === 'model') {
      allMessages.shift();
    }

    const result = await model.generateContent({ contents: allMessages });
    const response = await result.response;
    console.log("Success:", response.text());
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
