// netlify/functions/pageviews/pageviews.js
import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  // Récupérer le chemin de la page actuelle
  const url = new URL(req.url);
  const path = url.searchParams.get('path') || '/';
  
  // Ouvrir le stockage Blob (une sorte de base de données légère)
  const store = getStore('pageviews');
  
  // Lire le compteur actuel pour cette page
  const key = `views_${path}`;
  const existing = await store.get(key);
  let count = existing ? parseInt(existing) : 0;
  
  // Incrémenter le compteur
  count++;
  await store.set(key, count.toString());
  
  // Retourner la réponse JSON
  return new Response(JSON.stringify({ 
    path: path,
    views: count 
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};