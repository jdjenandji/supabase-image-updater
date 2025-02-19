// app/search/page.js
import { useState } from 'react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [resultImageUrl, setResultImageUrl] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResultImageUrl(data.imageUrl || null);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Simple Image Search</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter a search term..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '300px', padding: '0.5rem' }}
        />
        <button type="submit" style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}>
          Search
        </button>
      </form>
      {resultImageUrl && (
        <div style={{ marginTop: '2rem' }}>
          <img src={resultImageUrl} alt="Search result" style={{ maxWidth: '300px' }} />
        </div>
      )}
    </div>
  );
}
