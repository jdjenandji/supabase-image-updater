"use client";
import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Image Mood Search</h1>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter mood (e.g., happy, calm)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "300px", padding: "0.5rem" }}
        />
        <button type="submit" style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}>
          Search
        </button>
      </form>
      {loading && <p>Loading...</p>}
      {result && result.image_url && (
        <div style={{ marginTop: "2rem" }}>
          <img src={result.image_url} alt={result.mood} style={{ maxWidth: "300px" }} />
          <p>Mood: {result.mood}</p>
          <p>Distance: {result.distance.toFixed(2)}</p>
        </div>
      )}
      {result && result.error && <p>Error: {result.error}</p>}
    </div>
  );
}
