/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * one could get a copy at https://mozilla.org/MPL/2.0/.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

/**
 * Directories that MUST have a README.md
 * This is a heuristic - we want all major layer/component folders to be documented.
 */
const TARGET_DIRS = [
  "src",
  "src/adapters",
  "src/adapters/driven",
  "src/adapters/driven/database",
  "src/adapters/driven/database/repositories",
  "src/adapters/ui",
  "src/adapters/ui/components",
  "src/adapters/ui/composables",
  "src/adapters/ui/entrypoints",
  "src/adapters/ui/plugins",
  "src/adapters/ui/stores",
  "src/adapters/ui/views",
  "src/adapters/ui/_locales",
  "src/app",
  "src/app/usecases",
  "src/domain",
  "src/domain/types",
  "src/domain/validation",
  "tests",
  "scripts",
];

function extractExports(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const exports = [];
  
  // Basic regex for common export patterns
  const exportRegex = /export\s+(?:function|const|class|type|interface|enum)\s+([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // Named exports: export { a, b }
  const namedExportRegex = /export\s+\{([^}]+)\}/g;
  while ((match = namedExportRegex.exec(content)) !== null) {
    const names = match[1].split(",").map(n => n.trim().split(" as ")[0]);
    exports.push(...names);
  }

  // Default exports: export default ...
  if (/export\s+default/.test(content)) {
    exports.push("(default)");
  }

  return exports;
}

function generateDirectoryStructure(dirPath) {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  let structure = "## Directory Structure\n\n";

  const dirs = items.filter(i => i.isDirectory() && !i.name.startsWith(".") && i.name !== "node_modules");
  const files = items.filter(i => i.isFile() && !i.name.startsWith(".") && i.name !== "README.md");

  if (dirs.length > 0) {
    structure += "### Directories\n\n";
    for (const dir of dirs) {
      structure += `- \`${dir.name}/\`\n`;
    }
    structure += "\n";
  }

  if (files.length > 0) {
    structure += "### Files\n\n";
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      let entry = `- \`${file.name}\``;
      
      if (file.name.endsWith(".ts") || file.name.endsWith(".js") || file.name.endsWith(".mjs") || file.name.endsWith(".vue")) {
        try {
          const exports = extractExports(filePath);
          if (exports.length > 0) {
            // Limit to first 5 exports to keep it readable
            const displayExports = exports.slice(0, 5);
            entry += `: ${displayExports.join(", ")}${exports.length > 5 ? ", ..." : ""}`;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      structure += entry + "\n";
    }
    structure += "\n";
  }

  return structure;
}

/**
 * Descriptions for directories that can be automatically filled.
 * This acts as the "AI Knowledge Base" for the project structure.
 */
const DESCRIPTIONS = {
  "src": "The main source code of the extension, organized into hexagonal layers (domain, app, adapters).",
  "src/adapters": "Implementation of interfaces that communicate with the outside world (UI, database, browser APIs).",
  "src/adapters/driven": "Outbound adapters (secondary ports) for data persistence and external service communication.",
  "src/adapters/driven/database": "IndexedDB persistence layer implementation.",
  "src/adapters/driven/database/repositories": "Concrete repository classes for managing domain entities in IndexedDB.",
  "src/adapters/ui": "User interface implementation using Vue 3, Vuetify, and Pinia.",
  "src/adapters/ui/components": "Reusable Vue components used across the extension.",
  "src/adapters/ui/composables": "Vue composition functions for shared UI logic.",
  "src/adapters/ui/entrypoints": "Extension entry points (popup, options, background script, content scripts).",
  "src/adapters/ui/plugins": "Vue plugins and third-party integrations (e.g., Vuetify, Pinia configuration).",
  "src/adapters/ui/stores": "Pinia state management stores.",
  "src/adapters/ui/views": "Main page components and routing views.",
  "src/adapters/ui/_locales": "Internationalization (i18n) translation files and logic.",
  "src/app": "Application layer containing use cases and ports (interfaces).",
  "src/app/usecases": "Business use cases that orchestrate domain logic and infrastructure.",
  "src/domain": "Core business logic, entities, and domain rules. Framework-independent.",
  "src/domain/types": "TypeScript type definitions and interfaces for the domain model.",
  "src/domain/validation": "Centralized validation engine for domain entities and data integrity.",
  "tests": "Comprehensive test suite including unit, integration, and e2e tests.",
  "scripts": "Development and maintenance scripts for building, linting, and project management."
};

function updateReadme(dir) {
  const dirPath = path.join(ROOT, dir);
  if (!fs.existsSync(dirPath)) {
    console.warn(`Directory not found: ${dir}`);
    return;
  }

  const readmePath = path.join(dirPath, "README.md");
  let content = "";

  if (fs.existsSync(readmePath)) {
    content = fs.readFileSync(readmePath, "utf-8");
    console.log(`Updating existing README: ${readmePath}`);
    
    const newStructure = generateDirectoryStructure(dirPath);

    // Clean up duplicate "## Directory Structure" sections and ensure only one exists
    const structureHeader = "## Directory Structure";
    const headerIndex = content.indexOf(structureHeader);
    if (headerIndex !== -1) {
      console.log(`Updating existing Directory Structure in: ${readmePath}`);
      // Keep everything before the first header, then append the new structure
      content = content.substring(0, headerIndex).trimEnd() + "\n\n" + newStructure;
    } else {
      console.log(`Adding new Directory Structure to: ${readmePath}`);
      content = content.trimEnd() + "\n\n" + newStructure;
    }

    // Secondary cleanup: Sometimes multiple identical blocks were already present.
    // The logic above handles the first one, but if there were others they might still be there if they didn't follow the regex.
    // Actually, substring(0, headerIndex) removed everything AFTER the first header, so it's already clean!

    // Fill TODO descriptions if they exist and we have a description
    if (DESCRIPTIONS[dir]) {
      const todoRegex = /TODO: Add description and roles\/responsibilities\./;
      if (todoRegex.test(content)) {
        content = content.replace(todoRegex, DESCRIPTIONS[dir]);
      }
    }
  } else {
    console.log(`Creating new README: ${readmePath}`);
    const dirName = path.basename(dir);
    const title = dirName.charAt(0).toUpperCase() + dirName.slice(1);
    
    content = `# ${title} (\`${dir}/\`)\n\n`;
    content += (DESCRIPTIONS[dir] || "TODO: Add description and roles/responsibilities.") + "\n\n";
    content += generateDirectoryStructure(dirPath);
  }

  fs.writeFileSync(readmePath, content, "utf-8");
}

async function main() {
  // If the user provided a directory as an argument, only update that one
  const specificDir = process.argv[2];
  if (specificDir) {
    console.log(`Updating README for: ${specificDir}`);
    updateReadme(specificDir);
  } else {
    console.log("Updating project READMEs...");
    for (const dir of TARGET_DIRS) {
      updateReadme(dir);
    }
  }
  console.log("Done.");
}

main().catch(console.error);
