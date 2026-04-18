const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const KB_FILE = path.join(os.tmpdir(), 'knowledge_base.json');

// Initialize KB file in temp directory if it doesn't exist
if (!fs.existsSync(KB_FILE)) {
  const bundledKB = path.join(__dirname, 'knowledge_base.json');
  if (fs.existsSync(bundledKB)) {
    // Copy bundled data to writable temp directory
    fs.copyFileSync(bundledKB, KB_FILE);
  } else {
    fs.writeFileSync(KB_FILE, JSON.stringify({ content: '' }));
  }
}

// Get Knowledge Base
app.get('/api/kb', (req, res) => {
  try {
    const data = fs.readFileSync(KB_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read knowledge base' });
  }
});

// Update Knowledge Base
app.post('/api/kb', (req, res) => {
  try {
    const { content } = req.body;
    fs.writeFileSync(KB_FILE, JSON.stringify({ content }));
    res.json({ message: 'Knowledge base updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update knowledge base' });
  }
});

// Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    console.log(`[Chat] Received request. Messages: ${messages.length}`);

    const kbData = JSON.parse(fs.readFileSync(KB_FILE, 'utf8'));
    const kbContent = kbData.content;

    const systemPrompt = `
あなたの名前は「AIおぢ」です。
一人称は「私」または「僕」を使ってください。

性格・スタイル：
- 経験豊富で包容力のある「コーチングスタイル」のAIキャラクターです。
- 単に答えを教えるだけでなく、ユーザーが自分で気づきを得られるように、問いかけや励ましを混ぜて回答してください。
- 口調は丁寧ですが、親しみやすさを感じさせる「かっこいいおじさん」風の日本語でお願いします（必要以上に砕けすぎず、品格を保ってください）。
- ユーザーに対しては、並走するパートナーのような姿勢で接してください。

知識ベース（ナレッジベース）：
以下の情報は、あなたが知っておくべき特別な知識です。ユーザーからの質問がこれに関連する場合、この内容に基づいて回答してください。
---
${kbContent}
---

さあ、ユーザーに寄り添って、最高のコーチングを行ってください。
    `;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    console.log('[Chat] Successfully received response from Claude');
    res.json(response);
  } catch (error) {
    console.error('Claude API Error:', error);
    // 詳細なエラー情報をクライアントに返す
    res.status(error.status || 500).json({ 
      error: 'Failed to get response from Claude',
      details: error.message,
      type: error.type
    });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

module.exports = app;

// === ここから追加 ===
app.all('/chat', (req, res) => {
  res.json({ message: "Hello from chat!" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// === ここまで追加 ===
