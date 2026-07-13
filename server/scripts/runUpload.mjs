import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:5000/api';
const IMAGES_DIR = path.join(__dirname, 'skyline-images');

console.log('Step 1: Logging in...');
const loginRes = await fetch(BASE + '/admin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'aadityareality1@gmail.com', password: 'Yakshit@123' }),
});
const loginData = await loginRes.json();
if (!loginData.success) { console.error('Login failed:', loginData.message); process.exit(1); }
const setCookieRaw = loginRes.headers.get('set-cookie');
const token = loginData.token;
const authHeader = token ? ('Bearer ' + token) : null;
const cookieHeader = setCookieRaw ? setCookieRaw.split(';')[0] : null;
console.log('Login OK. token:', !!token, 'cookie:', !!cookieHeader);

const hdrs = (extra) => Object.assign({},
  authHeader ? { Authorization: authHeader } : {},
  cookieHeader ? { Cookie: cookieHeader } : {},
  extra || {}
);

console.log('Step 2: Fetching Aaditya Skyline project...');
const projRes = await fetch(BASE + '/admin/projects?limit=50', { headers: hdrs() });
const projData = await projRes.json();
const project = (projData.data || []).find(p => p.slug === 'aaditya-skyline' || /aaditya skyline/i.test(p.title));
if (!project) {
  console.error('Project not found! All projects:', JSON.stringify((projData.data||[]).map(p => p.title)));
  process.exit(1);
}
console.log('Found:', project.title, '| ID:', project._id, '| Gallery:', (project.gallery||[]).length);

const existingGallery = (project.gallery || []).map(g => ({ url: g.url, publicId: g.publicId }));
const images = [
  '01_main_view.jpg',
  '02_night_view.jpg',
  '03_shopping_shops.png',
  '04_basement_floor_plan.png',
  '05_ground_floor_plan.png',
];

const fd = new FormData();
fd.append('title', project.title);
fd.append('status', project.status);
fd.append('location', project.location);
fd.append('description', project.description);
fd.append('type', project.type || 'Residential');
fd.append('slug', project.slug);
fd.append('isFeatured', String(!!project.isFeatured));
fd.append('isActive', String(project.isActive !== false));
fd.append('displayOrder', String(project.displayOrder || 0));
fd.append('contactNumbers', JSON.stringify(project.contactNumbers || []));
fd.append('amenities', JSON.stringify(project.amenities || []));
if (project.startingPrice) fd.append('startingPrice', project.startingPrice);
if (project.possessionDate) fd.append('possessionDate', project.possessionDate);
if (project.reraNumber) fd.append('reraNumber', project.reraNumber);
if (project.saleableArea && project.saleableArea.minSqFt) {
  fd.append('saleableArea', JSON.stringify(project.saleableArea));
}
fd.append('existingGallery', JSON.stringify(existingGallery));

console.log('Step 3: Attaching image files...');
for (const fname of images) {
  const fpath = path.join(IMAGES_DIR, fname);
  const buf = fs.readFileSync(fpath);
  const mime = fname.endsWith('.png') ? 'image/png' : 'image/jpeg';
  fd.append('gallery', new Blob([buf], { type: mime }), fname);
  console.log('  Attached:', fname, '(' + buf.length + ' bytes)');
}

console.log('Step 4: Sending PATCH request to update project...');
const pRes = await fetch(BASE + '/admin/projects/' + project._id, {
  method: 'PATCH',
  headers: hdrs(),
  body: fd,
});
const pData = await pRes.json();
if (pData.success) {
  console.log('\n=== PROJECT UPDATED SUCCESSFULLY ===');
  console.log('Total gallery images:', (pData.data.gallery || []).length);
  (pData.data.gallery || []).forEach((g, i) => console.log('  [' + (i+1) + '] ' + g.url));
} else {
  console.error('\nPATCH FAILED:', JSON.stringify(pData, null, 2));
}
