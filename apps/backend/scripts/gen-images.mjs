// Jednorazowy generator brandowanych placeholderów SVG dla produktów seedowych.
// Uruchom: node scripts/gen-images.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "images", "products");

// Kolorystyka wg start-qai.pl
const NAVY = "#1d2d3d";
const NAVY_DARK = "#16222e";
const BLUE = "#416180";
const BLUE_LIGHT = "#5980a6";
const ORANGE = "#c47a1e";
const TEXT = "#f2f2f3";

const products = [
  { slug: "qai-mug", label: "Kubek", accent: ORANGE },
  { slug: "qai-tshirt", label: "Koszulka", accent: BLUE_LIGHT },
  { slug: "qai-hoodie", label: "Bluza", accent: ORANGE },
  { slug: "qai-stickers", label: "Naklejki", accent: BLUE_LIGHT },
  { slug: "qai-notebook", label: "Notatnik", accent: ORANGE },
  { slug: "qai-bottle", label: "Butelka", accent: BLUE_LIGHT },
];

function svg({ label, accent }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" role="img" aria-label="${label} QAI">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="1" stop-color="${NAVY_DARK}"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)"/>
  <rect x="40" y="40" width="520" height="520" rx="28" fill="none" stroke="${BLUE}" stroke-width="2" opacity="0.5"/>
  <circle cx="300" cy="250" r="120" fill="none" stroke="${accent}" stroke-width="10"/>
  <text x="300" y="268" font-family="'Oswald','Barlow Condensed',sans-serif" font-size="78" font-weight="700" fill="${accent}" text-anchor="middle">QAI</text>
  <text x="300" y="470" font-family="'Oswald','Barlow Condensed',sans-serif" font-size="46" font-weight="600" fill="${TEXT}" text-anchor="middle" letter-spacing="2">${label.toUpperCase()}</text>
  <text x="300" y="520" font-family="'Barlow',sans-serif" font-size="20" fill="${BLUE_LIGHT}" text-anchor="middle" letter-spacing="6">QAI SHOP</text>
</svg>
`;
}

await mkdir(outDir, { recursive: true });
for (const p of products) {
  await writeFile(join(outDir, `${p.slug}.svg`), svg(p), "utf8");
  console.log("  ✓", `${p.slug}.svg`);
}
console.log("Gotowe:", outDir);
