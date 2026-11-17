import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

// Shopify rejects uploads with literal section/block names longer than 25
// characters. Theme Check does not currently catch this limit in this project.
const directory = join(resolve(process.argv[2] || '.'), 'sections');
const failures = [];
let checked = 0;
for (const filename of readdirSync(directory).filter(name => name.endsWith('.liquid'))) {
  const source = readFileSync(join(directory, filename), 'utf8');
  const match = source.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  if (!match) continue;
  const schema = JSON.parse(match[1]);
  for (const [kind, objects] of [['section', [schema]], ['block', schema.blocks || []], ['preset', schema.presets || []]]) {
    for (const object of objects) {
      if (!object.name || object.name.startsWith('t:')) continue;
      checked++;
      if ([...object.name].length > 25) failures.push(`${filename}: ${kind} "${object.name}" exceeds 25 characters`);
    }
  }
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${checked} literal section, block and preset names.`);
}
