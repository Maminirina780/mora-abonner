import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";
if (!globalThis.crypto) Object.defineProperty(globalThis, "crypto", { value: webcrypto });

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// =====================================================================
//  CE QUI PROTEGE L ARGENT
// =====================================================================
//  Deux fonctions decident si une vente est encaissee : celle qui lit
//  le prix, et celle qui verifie la signature d une notification.
//
//  La premiere doit refuser tout ce qui n est pas un montant unique et
//  certain : facturer le mauvais chiffre est pire que ne rien facturer.
//  La seconde doit refuser tout ce qui n est pas signe par Papi — leur
//  documentation avertit que n importe qui peut envoyer un
//  « paymentStatus: SUCCESS » a une adresse publique.
//
//  Usage :  node bot-messenger/verif/papi.mjs
// =====================================================================

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "worker.js"), "utf8");
const bout = (nom, fin) => { const i = src.indexOf(nom); return src.slice(i, src.indexOf(fin, i)); };

const code =
  bout("function memeSecret", "\n}\n") + "}\n" +
  "const PAPI_TOLERANCE = 300;\n" +
  bout("function prixEnNombre", "\n/** Une reference") +
  bout("async function papiSignatureValide", "\n/* Ce qui se passe");
const { prixEnNombre, papiSignatureValide } = new Function(code +
  "; return { prixEnNombre, papiSignatureValide };")();

let prixRates = 0;
console.log("=== LECTURE DU PRIX ===");
for (const [p, attendu] of [
  ["100.000 Ar", 100000], ["50.000 Ar", 50000], ["20 000 Ar", 20000],
  ["200.000 Ar", 200000],
  ["10.000 à 40.000 Ar", null],
  ["Partagé 30.000 Ar | Personnel 120.000 Ar", null],
  ["Sur devis", null], ["", null], ["0 Ar", null],
]) {
  const r = prixEnNombre(p);
  if (r !== attendu) prixRates++;
  console.log(`${r === attendu ? "ok  " : "FAUX"} ${JSON.stringify(p).padEnd(44)} -> ${r}`);
}

console.log("\n=== SIGNATURE ===");
const secret = "pwhsec_" + "a".repeat(64);
const env = { PAPI_SECRET_SIGNATURE: secret };
const corps = JSON.stringify({ paymentStatus: "SUCCESS", amount: 100000, merchantPaymentReference: "MORAB-1-2-x" });
const t = Math.floor(Date.now() / 1000);

const signer = async (ts, body, cle = secret) => {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(cle),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(ts + "." + body));
  return [...new Uint8Array(s)].map(o => o.toString(16).padStart(2, "0")).join("");
};

const cas = [
  ["signature valide",                `t=${t},v1=${await signer(t, corps)}`,              corps, true],
  ["corps modifie",                   `t=${t},v1=${await signer(t, corps)}`,              corps.replace("100000", "1"), false],
  ["signe avec un autre secret",      `t=${t},v1=${await signer(t, corps, "pwhsec_autre")}`, corps, false],
  ["horodatage vieux de 10 min",      `t=${t - 600},v1=${await signer(t - 600, corps)}`,  corps, false],
  ["horodatage dans le futur",        `t=${t + 900},v1=${await signer(t + 900, corps)}`,  corps, false],
  ["en-tete absent",                  null,                                               corps, false],
  ["en-tete malforme",                "nimportequoi",                                     corps, false],
  ["signature vide",                  `t=${t},v1=`,                                       corps, false],
];
let rates = 0;
for (const [nom, entete, body, attendu] of cas) {
  const r = await papiSignatureValide(env, entete, body);
  if (r !== attendu) rates++;
  console.log(`${r === attendu ? "ok  " : "FAUX"} ${nom.padEnd(32)} -> ${r ? "acceptee" : "refusee"}`);
}

if (rates + prixRates) {
  console.error("\n" + (rates + prixRates) + " controle(s) en echec. Le deploiement est arrete :\n" +
    "une notification non verifiee laisse n importe qui declarer avoir paye.");
  process.exit(1);
}
console.log("\nTous les controles passent.");
