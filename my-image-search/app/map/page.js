"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function MapPage() {
  const [images, setImages] = useState([]);

  // Use public environment variables in client code
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  useEffect(() => {
    async function fetchImages() {
      const { data, error } = await supabase
        .from("images")
        .select("id, image_url, x, y");
      if (error) {
        console.error("Error fetching images:", error.message, error.details);
    } else {
        setImages(data);
      }
    }
    fetchImages();
  }, [supabase]);

  // Map x and y values from [-1,1] to [0,800]
  function mapX(x) {
    return (x + 1) * 400;
  }

  // For y, we invert so that +1 is at the top (0 px) and -1 is at the bottom (800 px)
  function mapY(y) {
    return 800 - (y + 1) * 400;
  }

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Emotion Map</h1>
      <div
        style={{
          position: "relative",
          width: "800px",
          height: "800px",
          margin: "0 auto",
          backgroundImage: "url('/emotion-wheel.png')", // Place your background image in the public folder
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid #ccc",
        }}
      >
        {images.map((img) => (
          <img
            key={img.id}
            src={img.image_url}
            alt={`Image ${img.id}`}
            style={{
              position: "absolute",
              left: `${mapX(img.x)}px`,
              top: `${mapY(img.y)}px`,
              width: "50px",
              height: "50px",
              transform: "translate(-50%, -50%)",
              border: "0px solid #fff",
            }}
          />
        ))}
      </div>
    </div>
  );
}
