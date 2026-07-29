import fs from "fs";
import path from "path";

const brainDir = "C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\29fca85a-2d47-4ff6-9757-d93d74ff8b4f";
const newLogoPath = path.join(brainDir, "media__1785311716531.jpg");
const faviconSnippetPath = path.join(brainDir, "media__1785311694694.png");

console.log("Checking if new logo source file exists:", fs.existsSync(newLogoPath));

if (fs.existsSync(newLogoPath)) {
  const clientPublic = "D:\\CHARUSAT\\Projects\\AdityaBuilder\\client\\public";
  const clientAssets = "D:\\CHARUSAT\\Projects\\AdityaBuilder\\client\\src\\assets";

  // Target paths
  const targets = [
    path.join(clientPublic, "logo.jpg"),
    path.join(clientPublic, "logo.png"),
    path.join(clientPublic, "favicon.jpg"),
    path.join(clientPublic, "favicon.png"),
    path.join(clientPublic, "logo-Aaditya.jpg"),
    path.join(clientAssets, "logo.jpg"),
    path.join(clientAssets, "logo.png"),
    path.join(clientAssets, "logo-Aaditya.jpg")
  ];

  for (const t of targets) {
    fs.copyFileSync(newLogoPath, t);
    console.log(`✅ Copied new logo to: ${t}`);
  }
}

process.exit(0);
