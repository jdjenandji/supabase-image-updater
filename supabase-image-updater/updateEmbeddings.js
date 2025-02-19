// updateEmbeddings.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // If you're on Node v18+, fetch is built-in.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text
    })
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API Error: ${errorBody}`);
  }
  const data = await response.json();
  // The embedding is in data.data[0].embedding
  return data.data[0].embedding;
}

async function updateEmbeddings() {
  // 1. Get images that have a mood but no embedding
  const { data: images, error } = await supabase
    .from('images')
    .select('id, mood')
    .is('mood_embedding', null) // only rows where mood_embedding is NULL
    .not('mood', 'is', null);   // only rows that have a mood

  if (error) {
    console.error("Error fetching images:", error);
    return;
  }

  if (!images || images.length === 0) {
    console.log("No images found that need embeddings.");
    return;
  }

  console.log(`Found ${images.length} images needing embeddings...`);

  for (const img of images) {
    try {
      // 2. Generate an embedding from the mood text
      const embedding = await generateEmbedding(img.mood);

      // 3. Update the row with the embedding
      const { error: updateError } = await supabase
        .from('images')
        .update({ mood_embedding: embedding })
        .eq('id', img.id);

      if (updateError) {
        console.error(`Error updating embedding for image ${img.id}:`, updateError);
      } else {
        console.log(`Updated embedding for image ${img.id}`);
      }
    } catch (err) {
      console.error(`Failed to generate embedding for image ${img.id}:`, err);
    }
  }
}

updateEmbeddings();
