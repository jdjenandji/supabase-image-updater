// assignXY.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Or use fetch with the Chat Completions endpoint
// import fetch from 'node-fetch'; // if needed in Node < 18

// 1. Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 2. A function to call the LLM and return an (x, y) in [-1..1]
async function getXYfromMood(moodText) {
  // Example using the Chat Completions endpoint (GPT-3.5 or GPT-4)
  // We'll do a raw fetch. You can also use the openai npm package if you prefer.

  const prompt = `
You are given a mood description of an image: "${moodText}"
Please map this mood to two coordinates (x, y) in the range [-1..1], where:
- x represents valence (negative vs positive)
- y represents arousal (low vs high)

Return the coordinates as JSON in this format: {"x": number, "y": number}
For example: {"x": 0.5, "y": -0.2}
  `;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo", // or "gpt-4"
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0, // reduce randomness
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();

  // Attempt to parse the returned JSON
  let coords;
  try {
    coords = JSON.parse(content);
  } catch (err) {
    // fallback: parse with regex or handle errors
    console.error("Error parsing JSON from LLM:", content);
    coords = { x: 0, y: 0 }; // fallback
  }

  return coords;
}

// 3. Main function to update rows in the images table
async function assignXY() {
  // Fetch all rows that have no x or y yet
  const { data: images, error } = await supabase
    .from("images")
    .select("id, mood, x, y")
    .is("x", null);

  if (error) {
    console.error("Error fetching images:", error);
    return;
  }

  if (!images || images.length === 0) {
    console.log("No images found that need x,y assignment.");
    return;
  }

  for (const img of images) {
    const moodText = img.mood;
    console.log(`Processing image ${img.id} with mood:`, moodText);

    try {
      const { x, y } = await getXYfromMood(moodText);
      console.log(`LLM returned x=${x}, y=${y}`);

      // Update the row
      const { error: updateError } = await supabase
        .from("images")
        .update({ x, y })
        .eq("id", img.id);

      if (updateError) {
        console.error("Error updating x,y for image", img.id, updateError);
      } else {
        console.log("Updated x,y for image", img.id);
      }
    } catch (err) {
      console.error("Error assigning x,y for image", img.id, err);
    }
  }
}

// 4. Run the script
assignXY();
