// app/api/search/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using environment variables.
// We use the service key here since this is server-side code.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
  // Parse the URL and extract the "query" parameter.
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  // Query the "images" table for rows where the mood column
  // matches the query (case-insensitive partial match).
  const { data, error } = await supabase
    .from("images")
    .select("id, image_url, mood")
    .ilike("mood", `%${query}%`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: "No matching images found" }, { status: 404 });
  }

  // Return the matching images as JSON.
  return NextResponse.json(data);
}
