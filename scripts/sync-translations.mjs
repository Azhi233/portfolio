import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_PATH = path.join(ROOT, 'src/i18n/zh.js');
const TARGET_PATH = path.join(ROOT, 'src/i18n/en.js');

async function readModuleLocale(filePath, exportName) {
  const text = await fs.readFile(filePath, 'utf8');
  const match = text.match(new RegExp(`export const ${exportName} = (\\{[\\s\\S]*\\});?\\s*$`));
  if (!match) throw new Error(`Could not parse ${exportName} from ${path.basename(filePath)}`);
  return JSON.parse(match[1]);
}

function flattenStrings(obj, prefix = [], result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const nextPath = [...prefix, key];
    if (typeof value === 'string') {
      result[nextPath.join('.')] = value;
      continue;
    }
    if (value && typeof value === 'object') flattenStrings(value, nextPath, result);
  }
  return result;
}

async function main() {
  const [source, target] = await Promise.all([
    readModuleLocale(SOURCE_PATH, 'zh'),
    readModuleLocale(TARGET_PATH, 'en'),
  ]);

  const sourceFlat = flattenStrings(source);
  const targetFlat = flattenStrings(target);
  const missing = Object.entries(sourceFlat).filter(([key]) => !targetFlat[key]);

  if (missing.length === 0) {
    console.log('No missing translation keys found.');
    return;
  }

  console.log(`Found ${missing.length} missing translation keys.`);
  for (const [key, value] of missing) {
    console.log(`- ${key}: ${value}`);
  }

  console.log('\nNext step: wire a translation provider here to fill missing keys, then write the updated locale file back to disk.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
