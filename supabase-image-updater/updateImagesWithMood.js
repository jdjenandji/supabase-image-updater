// updateImagesWithMood.js
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { getImageMood } from './openaiMoodAnalysis.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'Moods';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in your .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateImagesMood() {
  console.log(`Listing files in bucket: "${BUCKET_NAME}"`);

  // List files in the root of the bucket
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list('', { limit: 100, offset: 0 });

  if (listError) {
    console.error("Error listing files:", listError);
    return;
  }

  if (!files || files.length === 0) {
    console.log(`Found 0 file(s) in the "${BUCKET_NAME}" bucket.`);
    return;
  }

  console.log(`Found ${files.length} file(s) in the "${BUCKET_NAME}" bucket:`);
  console.log(files);

  // Process each file
  for (const file of files) {
    const filePath = file.name;

    // Get the public URL for the file
    const { data: urlData, error: urlError } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (urlError) {
      console.error(`Error getting public URL for ${filePath}:`, urlError);
      continue;
    }

    const publicURL = urlData.publicUrl;
    if (!publicURL) {
      console.error(`No public URL returned for ${filePath}`);
      continue;
    }

    console.log(`Processing file: ${filePath}`);
    console.log(`Public URL: ${publicURL}`);

    // Check if a mood already exists in the "images" table for this URL
    const { data: existingRecords, error: selectError } = await supabase
      .from('images')
      .select('id, mood')
      .eq('image_url', publicURL);

    if (selectError) {
      console.error(`Error checking record for ${publicURL}:`, selectError);
      continue;
    }

    if (existingRecords && existingRecords.length > 0 && existingRecords[0].mood) {
      console.log(`Image for ${publicURL} already has a mood ("${existingRecords[0].mood}"). Skipping...`);
      continue;
    }

    // Use OpenAI Vision to determine the mood
    const mood = await getImageMood(publicURL);
    if (!mood) {
      console.error(`Failed to determine mood for ${publicURL}`);
      continue;
    }
    console.log(`Determined mood: ${mood}`);

    // Update or insert the mood into the "images" table
    if (existingRecords && existingRecords.length > 0) {
      const { error: updateError } = await supabase
        .from('images')
        .update({ mood: mood })
        .eq('id', existingRecords[0].id);
      if (updateError) {
        console.error(`Error updating mood for ${publicURL}:`, updateError);
      } else {
        console.log(`Updated mood for ${publicURL} to "${mood}"`);
      }
    } else {
      const { error: insertError } = await supabase
        .from('images')
        .insert([{ image_url: publicURL, mood: mood, mood_embedding: null }]);
      if (insertError) {
        console.error(`Error inserting mood for ${publicURL}:`, insertError);
      } else {
        console.log(`Inserted mood for ${publicURL}: "${mood}"`);
      }
    }
  }
}

updateImagesMood()
  .then(() => console.log("Update images mood process completed."))
  .catch(err => console.error("Error in updateImagesMood:", err));
