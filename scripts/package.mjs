import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
const out = resolve("artifacts");
mkdirSync(out, { recursive: true });
const files = readdirSync("dist");
if (!files.includes("index.html"))
  throw new Error("Build is missing index.html");
let size = 0;
function walk(path) {
  for (const name of readdirSync(path)) {
    const p = path + "/" + name;
    const stat = statSync(p);
    if (stat.isDirectory()) walk(p);
    else size += stat.size;
  }
}
walk("dist");
if (size > 100 * 1024 * 1024)
  throw new Error("Archive exceeds the Yandex Games limit");
const archive = resolve(out, "elderia-yandex.zip");
// Remove a previous archive so zip never retains obsolete assets.
execFileSync("python3", [
  "-c",
  'import sys,zipfile,pathlib; root=pathlib.Path(sys.argv[1]); z=zipfile.ZipFile(sys.argv[2],"w",zipfile.ZIP_DEFLATED); [z.write(p,p.relative_to(root)) for p in root.rglob("*") if p.is_file()]; z.close()',
  resolve("dist"),
  archive,
]);
console.log(
  `Yandex Games archive: ${archive}\nUncompressed size: ${(size / 1024).toFixed(1)} KB`,
);
