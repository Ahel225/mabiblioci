import express from "express";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const client = new OpenAI(); // lit OPENAI_API_KEY depuis l'environnement

app.use(express.json({ limit: "100kb" }));
app.use(express.static(__dirname));

app.post("/api/ai/explain", async (req, res) => {
  try {
    const { articleNumber, articleText, question, codeTitle } = req.body || {};

    if (!articleNumber || !articleText || !question) {
      return res.status(400).json({ error: "Article ou question manquant." });
    }

    const instructions = `
Tu es l'assistant pédagogique intégré à une bibliothèque juridique ivoirienne.
Ta mission est d'expliquer le texte fourni à un lecteur non juriste.

RÈGLES IMPÉRATIVES :
- Base-toi d'abord et principalement sur le texte de l'article fourni.
- Ne modifie jamais le sens du texte.
- Ne présente pas une interprétation comme une certitude si elle n'est pas directement déductible.
- N'invente ni article, ni sanction, ni exception, ni jurisprudence.
- Si la question dépasse le contenu fourni, dis-le clairement.
- Distingue toujours "ce que dit le texte" de toute explication pédagogique.
- Utilise un français simple, précis et accessible.
- Pour une explication, privilégie : idée principale, personnes concernées, obligations/droits, conditions ou exceptions, conséquences pratiques, exemple.
- Rappelle brièvement que l'explication est pédagogique et que le texte officiel reste la référence.
- Ne donne pas de conseil juridique personnalisé.

Réponds en Markdown simple avec des titres courts.
`;

    const input = `
Code : ${codeTitle}
Article : ${articleNumber}

TEXTE DE L'ARTICLE :
${articleText}

QUESTION DU LECTEUR :
${question}
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions,
      input,
      store: false
    });

    res.json({ answer: response.output_text || "Je n'ai pas pu produire une explication." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la génération de l'explication IA." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Bibliothèque juridique : http://localhost:${port}/Code_minier_Cote_d_Ivoire_avec_Assistant_IA.html`);
});
