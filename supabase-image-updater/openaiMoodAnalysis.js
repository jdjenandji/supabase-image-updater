// openaiMoodAnalysis.js
import 'dotenv/config';

/**
 * Uses OpenAI Vision (e.g., GPT-4o) to determine the mood of an image.
 * The function sends a message with both text and an image URL.
 *
 * @param {string} imageUrl - The public URL of the image.
 * @returns {Promise<string|null>} - The mood as determined by the model (e.g., "happy", "calm"), or null on error.
 */
export async function getImageMood(imageUrl) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
         model: "gpt-4o", // Use the vision-enabled GPT-4o model (or "gpt-4o-mini" if preferred)
         messages: [
            {
              role: "user",
              content: [
                 { type: "text", text: "What is the mood of this image?" },
                 { type: "image_url", image_url: { url: imageUrl } }
              ]
            }
         ],
         max_tokens: 20,
         temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI API returned an error: ${response.statusText}. Body: ${errorBody}`);
    }

    const data = await response.json();
    // The response for a Chat Completion contains a "message" field in each choice.
    const mood = data.choices[0].message.content.trim();
    return mood;
  } catch (err) {
    console.error("Error getting image mood from OpenAI Vision:", err);
    return null;
  }
}
