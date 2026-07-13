import axios from "axios";

const run = async () => {
  const url = "https://drive.google.com/drive/folders/1ED1NQQytaiuXrtCU7uMnhuDqvKflf0xK?usp=sharing";
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    const html = res.data;
    
    // Find all links containing drive.google.com/file/d/
    const matches = html.matchAll(/https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/g);
    const ids = Array.from(new Set(Array.from(matches).map(m => m[1])));
    console.log("Extracted File IDs from folder HTML:", ids);
  } catch (err) {
    console.error("Error reading folder:", err.message);
  }
};
run();
