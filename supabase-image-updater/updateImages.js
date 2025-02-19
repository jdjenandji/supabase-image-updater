// updateImages.js

// 1. Load environment variables (adjust the path if your .env is in a different directory)
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// 2. Retrieve environment variables from .env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'Moods';

// 3. Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in your .env file.");
  process.exit(1);
}

// 4. Create the Supabase client (service key required for admin ops)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 5. Main function to list and update images
async function updateImagesTable() {
  console.log(`Listing files in bucket: "${BUCKET_NAME}"`);

  // a) List files in the root of the bucket
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

  // b) Loop through each file
  for (const file of files) {
    const filePath = file.name;

    // c) Get the public URL (note the new return structure)
    const { data: urlData, error: urlError } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (urlError) {
      console.error(`Error getting public URL for ${filePath}:`, urlError);
      continue;
    }

    // d) Extract the actual public URL
    const publicURL = urlData.publicUrl;
    if (!publicURL) {
      console.error(`No public URL returned for ${filePath}`);
      continue;
    }

    console.log(`Processing file: ${filePath}`);
    console.log(`Public URL: ${publicURL}`);

    // e) Check if a record already exists in the "images" table
    const { data: existingRecords, error: selectError } = await supabase
      .from('images')
      .select('id')
      .eq('image_url', publicURL);

    if (selectError) {
      console.error(`Error checking record for ${publicURL}:`, selectError);
      continue;
    }

    if (existingRecords && existingRecords.length > 0) {
      console.log(`Record for ${publicURL} already exists. Skipping...`);
      continue;
    }

    // f) Insert a new record (mood and mood_embedding left null)
    const { data: insertData, error: insertError } = await supabase
      .from('images')
      .insert([
        {
          image_url: publicURL,
          mood: null,
          mood_embedding: null
        }
      ]);

    if (insertError) {
      console.error(`Error inserting record for ${publicURL}:`, insertError);
    } else {
      console.log(`Inserted record for ${publicURL}`);
    }
  }
}

// 6. Execute the update process
updateImagesTable()
  .then(() => {
    console.log("Update images process completed.");
  })
  .catch((err) => {
    console.error("Error in updateImagesTable:", err);
  });
