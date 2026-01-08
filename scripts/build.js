/**
 * Build script for Team Ensemble contact cards
 *
 * Reads YAML data files from /data folder
 * Generates HTML pages and vCard files to /dist folder
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const DATA_DIR = path.join(ROOT_DIR, "data");
const TEMPLATES_DIR = path.join(ROOT_DIR, "templates");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const ASSETS_DIR = path.join(ROOT_DIR, "assets");

/**
 * Generate vCard content from contact data
 */
function generateVCard(data) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.name.full}`,
    `N:${data.name.last};${data.name.first}`,
  ];

  if (data.title) {
    lines.push(`TITLE:${data.title}`);
  }

  if (data.organization) {
    lines.push(`ORG:${data.organization}`);
  }

  if (data.contact?.phone?.mobile) {
    lines.push(`TEL;TYPE=CELL:${getRawPhoneNumber(data.contact.phone.mobile)}`);
  }

  if (data.contact?.email) {
    lines.push(`EMAIL:${data.contact.email}`);
  }

  if (data.contact?.website) {
    lines.push(`URL;TYPE=WORK:${data.contact.website}`);
  }

  if (data.social) {
    for (const [platform, url] of Object.entries(data.social)) {
      if (url) {
        // lines.push(`X-SOCIALPROFILE;TYPE=${platform}:${url}`);
        lines.push(`URL;TYPE=WORK:${data.social.linkedin}`);
      }
    }
  }

  lines.push("END:VCARD");

  return lines.join("\r\n");
}

/**
 * Extract display URL from full URL
 */
function getWebsiteDisplay(url) {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * Extract raw phone number from formatted number
 */
function getRawPhoneNumber(formatted) {
  if (!formatted) return "";
  return formatted.replace(/\D|\+/g, "");
}

/**
 * Get vCard filename from name
 */
function getVCardFilename(name) {
  return `${name.first}-${name.last}.vcf`;
}

/**
 * Ensure directory exists
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Copy directory recursively
 */
function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Build all contact cards
 */
async function build() {
  console.log("🚀 Building contact cards...\n");

  // Clean dist directory
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true });
  }
  ensureDir(DIST_DIR);

  // Copy assets if they exist
  if (fs.existsSync(ASSETS_DIR)) {
    console.log("📁 Copying assets...");
    copyDir(ASSETS_DIR, path.join(DIST_DIR));
  }

  // Load template
  const templatePath = path.join(TEMPLATES_DIR, "card.html");
  if (!fs.existsSync(templatePath)) {
    console.error("❌ Template not found:", templatePath);
    process.exit(1);
  }
  const templateSource = fs.readFileSync(templatePath, "utf-8");
  const template = Handlebars.compile(templateSource);

  // Get all YAML files
  if (!fs.existsSync(DATA_DIR)) {
    console.error("❌ Data directory not found:", DATA_DIR);
    process.exit(1);
  }

  const yamlFiles = fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

  if (yamlFiles.length === 0) {
    console.warn("⚠️  No YAML files found in data directory");
    process.exit(0);
  }

  console.log(`📇 Found ${yamlFiles.length} contact(s)\n`);

  // Process each contact
  for (const file of yamlFiles) {
    const filePath = path.join(DATA_DIR, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const dataRaw = yaml.load(content);
    const data = {
      ...dataRaw,
      organization: dataRaw.organization || "Stiftung Team Ensemble",
      name : {
        ...dataRaw.name,
        full: `${dataRaw.name.first} ${dataRaw.name.last}`,
      },
      contact: {
        ...dataRaw.contact,
        website: dataRaw.contact?.website || "https://team-ensemble.ch",
      }
    };

    const slug = data.slug || file.replace(/\.(yaml|yml)$/, "");
    const outputDir = path.join(DIST_DIR, slug);
    ensureDir(outputDir);

    console.log(`  → ${data.name.full} (${slug})`);

    // Prepare template data
    const vcardFilename = getVCardFilename(data.name);
    const templateData = {
      ...data,
      websiteDisplay: getWebsiteDisplay(data.contact?.website),
      vcardFilename: vcardFilename,
    };

    // Generate HTML
    const html = template(templateData);
    fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf-8");

    // Generate vCard
    const vcard = generateVCard(data);
    fs.writeFileSync(path.join(outputDir, vcardFilename), vcard, "utf-8");
  }

  // Create .nojekyll file to disable Jekyll processing on GitHub Pages
  fs.writeFileSync(path.join(DIST_DIR, ".nojekyll"), "", "utf-8");

  console.log("\n✅ Build complete!");
  console.log(`   Output: ${DIST_DIR}`);
}

// Run build
build().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
