// =====================================================================
//  LA CONSOLE S EXECUTE-T-ELLE ?
// =====================================================================
//  Une erreur de syntaxe dans le script de la console n est pas une
//  gene : le navigateur n execute RIEN. Le logo reste un placeholder,
//  la liste des langues reste vide, aucun bouton ne repond — et la page
//  se charge sans le moindre message.
//
//  C est arrive : un guillemet echappe dans un attribut HTML a ferme la
//  chaine JavaScript qui le portait. La console est restee inutilisable
//  jusqu a ce que le proprietaire envoie une capture.
//
//  Le script vit dans un litteral gabarit : pour l analyser, il faut
//  defaire les echappements exactement comme JavaScript le fait, et
//  neutraliser les interpolations — jamais deviner.
//
//  Usage :  node bot-messenger/verif/console.mjs
// =====================================================================

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const ICI = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(ICI, "..", "worker.js"), "utf8");

const i = source.indexOf("<script>");
const j = source.lastIndexOf("</script>");
if (i < 0 || j <= i) {
  console.error("Aucun script trouve dans la page de la console.");
  process.exit(1);
}

let js = source.slice(i + 8, j);

// 1. Les echappements du litteral gabarit.
js = js.replace(/\\(.)/gs, (_, c) => ({ n: "\n", t: "\t", "\\": "\\" }[c] ?? c));

// 2. Les valeurs posees par le Worker au moment de servir la page. On
//    n accepte que des noms en CAPITALES : « ${` + `x}` dans une chaine
//    est du code legitime, et le confondre ferait crier au loup.
js = js.replace(/\{\{[A-Z_]+\}\}/g, "0").replace(/\$\{[A-Z_][A-Z0-9_]*\}/g, "0");

try {
  new vm.Script(js, { filename: "console.js" });
} catch (e) {
  console.error("La console NE S EXECUTERA PAS :\n  " + e.message);
  const n = Number(String(e.stack).match(/console\.js:(\d+)/)?.[1] || 0);
  if (n) console.error("  ligne " + n + " : " + (js.split("\n")[n - 1] || "").trim().slice(0, 160));
  process.exit(1);
}

console.log("La console s analyse sans erreur (" + Math.round(js.length / 1024) + " ko).");
