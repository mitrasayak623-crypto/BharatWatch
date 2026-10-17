import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize GoogleGenAI server-side with required User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// TV Companion Chatbot API
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history, currentChannel } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const systemInstruction = `You are BharatLive AI, an intelligent, enthusiastic, and culturally attuned Indian Live Television and Entertainment Guide.
You assist viewers in discovering live telecasts, cricket matches, breaking news, regional cinema, daily soaps, spiritual darshans, and music across Indian languages (Hindi, Tamil, Telugu, Bengali, Malayalam, Kannada, Marathi, Punjabi, Gujarati, English).

Guidelines:
- Give concise, engaging, and practical recommendations.
- If the user asks what to watch, recommend specific channels and shows currently telecasting or popular in India.
- Current active channel context: ${currentChannel ? `${currentChannel.name} (CH ${currentChannel.number}, ${currentChannel.category}, ${currentChannel.language}) - currently playing "${currentChannel.currentProgram?.title || 'Live Telecast'}"` : 'None selected'}.
- Mention channel numbers when referencing channels in BharatLive TV (e.g. "DD Sports HD (CH 101)", "Aaj Tak HD (CH 201)", "Star Gold (CH 301)", "Sun TV (CH 403)", "Asianet News (CH 209)", "9XM (CH 501)").
- Keep formatting clean, scannable, and natural. Avoid excessive markdown bullet trees.`;

    // Build chat contents from history
    const contents: Array<{ role: 'user' | 'model'; parts: [{ text: string }] }> = [];

    if (Array.isArray(history)) {
      for (const item of history.slice(-8)) {
        if (item.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.sender === 'bot') {
          contents.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents as any,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      reply: response.text || "I'm tuned into BharatLive TV! How can I help you pick the best channel to watch?",
    });
  } catch (err: any) {
    console.error('Gemini API error in /api/chat:', err);
    res.status(500).json({
      error: 'Failed to generate response',
      details: err?.message || 'Server error',
    });
  }
});

// Live Streaming Database Health/Status API
app.get('/api/iptv/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    appName: 'BharatWatch',
    country: 'IN',
    playerEngines: ['Shaka Player 5.3', 'YouTube Live Official Embeds'],
    pipEngine: 'Active Native & In-App Floating PiP Dock',
    timestamp: new Date().toISOString(),
  });
});

// CORS Stream Proxy for HLS and DASH manifests & video segments
app.get('/api/proxy-stream', async (req: Request, res: Response) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl || typeof targetUrl !== 'string') {
    res.status(400).send('Missing url parameter');
    return;
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: new URL(targetUrl).origin,
      },
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    const contentType = upstreamRes.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);

    const buffer = await upstreamRes.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    res.status(502).send(`Proxy error: ${err?.message || err}`);
  }
});

app.options('/api/proxy-stream', (_req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.sendStatus(204);
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
