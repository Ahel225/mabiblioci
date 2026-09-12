import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '200kb' }));
app.use(express.static(__dirname));

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const SYSTEM_PROMPT = `
Tu es l’Assistant pédagogique en droit ivoirien intégré à une bibliothèque juridique numérique.

Code concerné : Code de l’Environnement de Côte d’Ivoire, Loi n° 2023-900 du 23 novembre 2023.

Règles impératives :
- Explique uniquement le texte de l’article transmis.
- Ne crée aucune disposition, sanction, exception, procédure ou jurisprudence qui ne figure pas dans le texte fourni.
- Distingue clairement le texte juridique de ton explication.
- Si le texte transmis ne permet pas de répondre, dis-le explicitement.
- Explique en français simple et précis.
- Structure lorsque c’est pertinent : idée principale, personnes concernées, droits/obligations, conditions, conséquences, exemple.
- Un exemple doit être présenté comme un exemple pédagogique et non comme une disposition de la loi.
- Ne donne pas de conseil juridique personnalisé.
- Ne prétends pas remplacer un professionnel du droit.
`.trim();

app.post('/api/ai/explain', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({
        error: 'OPENAI_API_KEY n’est pas configurée sur le serveur.'
      });
    }

    const { articleNumber, articleText, question } = req.body || {};

    if (!articleText || typeof articleText !== 'string') {
      return res.status(400).json({
        error: 'Le texte de l’article est obligatoire.'
      });
    }

    const userPrompt = `
Article : ${articleNumber || 'non précisé'}

Texte de l’article :
---
${articleText}
---

${question ? `Question de l’utilisateur :\n${question}` : 'Explique cet article de manière pédagogique.'}
`.trim();

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-luna',
      instructions: SYSTEM_PROMPT,
      input: userPrompt,
      max_output_tokens: 1200
    });

    res.json({ answer: response.output_text || 'Aucune réponse générée.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error?.message || 'Erreur lors de la communication avec le service IA.'
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.listen(PORT, () => {
  console.log(`Bibliothèque juridique : http://localhost:${PORT}`);
});