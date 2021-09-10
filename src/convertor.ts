import * as arJSon from "world_countries_lists/data/ar/world.json";
import * as frJSon from "world_countries_lists/data/fr/world.json";
import * as enJSon from "world_countries_lists/data/en/world.json";
import * as enJsonWithContinents from "../assets/country-and-continent.json";
import * as enJsonWithDial from "../assets/alpha-and-dial.json";
import * as fs from "fs";
import { join, basename, extname } from "path";

function hasNull(target: any) {
  for (var member in target) {
    if (!target[member]) return true;
  }
  return false;
}

console.log("wait for processing...");

let arData = arJSon.sort((a, b) => a.id - b.id);
let frData = frJSon.sort((a, b) => a.id - b.id);
let enData = enJSon.sort((a, b) => a.id - b.id);

let dialCodeData = enJsonWithDial.reduce<{ [x: string]: string }>(
  (obj, { isoCode, dialCode }) => {
    obj[isoCode.toLowerCase()] = dialCode;
    return obj;
  },
  {}
);

let ourData = [];

for (let i = 0; i < frData.length; i++) {
  const continent = enJsonWithContinents.find(
    (item) =>
      item.Three_Letter_Country_Code?.toLowerCase() ===
      enData[i].alpha3.toLowerCase()
  )?.Continent_Name;
  let dataElement = {
    alpha2: frData[i].alpha2 || "unknown",
    continent: continent || "unknown",
    nameEN: enData[i].name || "unknown",
    nameFR: frData[i].name || "unknown",
    nameAR: arData[i].name || "unknown",
    dial: dialCodeData[frData[i].alpha2] || "unknown",
  };

  if (dataElement && !hasNull(dataElement) && dataElement.alpha2 != "il") {
    ourData.push(dataElement);
  }
}

const distDir = join(__dirname, "..", "dist");

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

fs.writeFileSync(
  join(distDir, "countries.json"),
  JSON.stringify(ourData, null, 2)
);

console.log("finished JSON format, working on images");

const flagsSrcDir = join(
  __dirname,
  "..",
  "node_modules",
  "world_countries_lists",
  "flags"
);

const flagsDistDir = join(__dirname, "..", "dist", "flags");

if (!fs.existsSync(flagsDistDir)) {
  fs.mkdirSync(flagsDistDir);
}

const dims = [32, 128];

for (let i = 0; i < dims.length; i++) {
  let dim = dims[i];
  const dimDir = `${dim}x${dim}`;

  const dimFlagsDistDir = join(flagsDistDir, dimDir);

  if (!fs.existsSync(dimFlagsDistDir)) {
    fs.mkdirSync(dimFlagsDistDir);
  }

  const dimFlagsSrcDir = join(flagsSrcDir, dimDir);

  let files = fs.readdirSync(dimFlagsSrcDir);

  if (files && files.length) {
    files.forEach((file) => {
      if (!file.match(/^il\./)) {
        fs.copyFileSync(
          join(dimFlagsSrcDir, file),
          join(dimFlagsDistDir, file)
        );
      }
    });
  }

  if (ourData.some((data) => data.continent === "unknown")) {
    console.warn(
      'Warning!! some countries\' continents are not provided and put as "unknown", replace them with a correct value.'
    );
  }
  console.log(`finished ${dim}x${dim} images, working on the rest if any.`);
}

console.log(`finished ${ourData.length} country! look on ./dist/`);
