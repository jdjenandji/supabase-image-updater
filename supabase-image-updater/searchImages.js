// pages/api/search.js
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // If needed (Node 18+ has fetch globally)

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Function to generate an embedding for a text query using OpenAI
async function generateQueryEmbedding(text) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API Error: ${errorBody}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// API route handler
export default async function handler(req, res) {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Missing query parameter" });
    }

    // 1. Generate an embedding for the user's query
    const queryEmbedding = await generateQueryEmbedding(query);

    // 2. Call an RPC (or raw SQL) function to search by vector similarity.
    // Here we assume you've already created an RPC function named `search_images`
    // in your Supabase database.
    const { data, error } = await supabase.rpc('search_images', {
      query_embedding: queryEmbedding,
      match_count: 10
    });

    if (error) {
      throw error;
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("Error in /api/search:", err);
    return res.status(500).json({ error: err.message });
  }
}
