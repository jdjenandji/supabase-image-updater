// app/api/search/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  // Return a placeholder image for demonstration
  let imageUrl = 'https://picsum.photos/400/300';
  if (query.toLowerCase().includes('cat')) {
    imageUrl = 'https://placekitten.com/400/300';
  }

  return NextResponse.json({ imageUrl });
}
