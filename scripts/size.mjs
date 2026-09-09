import { readdir, stat } from 'node:fs/promises';

// Conservative cap: all non-Markdown tracked candidates, including tests and tooling.
async function filesIn(dir = '.') {
  const entries = await readdir(dir, { withFileTypes: true });
  const skip = /^(\.git|node_modules|\.hallmark|\.impeccable|evidence|docs)$/;
  const lists = await Promise.all(entries.filter(e => !skip.test(e.name)).map(async e => {
    const path = `${dir}/${e.name}`;
    return e.isDirectory() ? filesIn(path) : /\.(md|png|jpg|webp)$/.test(e.name) ? [] : [path];
  }));
  return lists.flat().sort();
}
const files = await filesIn();
let total = 0;
for (const path of files) {
  const bytes = (await stat(path)).size;
  total += bytes;
  console.log(`${String(bytes).padStart(6)}  ${path}`);
}
console.log(`${total} / 40000 bytes (${40000 - total} remaining)`);
if (total > 40000) process.exitCode = 1;
