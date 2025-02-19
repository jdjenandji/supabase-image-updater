// app/api/search/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using environment variables.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Function to generate an embedding for a query text using OpenAI's embeddings API.
async function generateQueryEmbedding(text) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API Error: ${errorText}`);
  }
  
  const data = await response.json();
  return data.data[0].embedding;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
    }

    console.log("Received query:", query);

    // Generate the query embedding
    const queryEmbedding = await generateQueryEmbedding(query);
    console.log("Generated query embedding.");

    // Call the RPC function to get the closest matching image
    const { data, error } = await supabase.rpc("search_closest_image", {
      query_embedding: queryEmbedding,
      match_count: 1
    });

    if (error) {
      console.error("Supabase RPC error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log("No matching images found for query:", query);
      return NextResponse.json({ error: "No matching images found" }, { status: 404 });
    }

    console.log("Returning matching image:", data[0]);
    return NextResponse.json(data[0]);
  } catch (err) {
    console.error("Error in API route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
