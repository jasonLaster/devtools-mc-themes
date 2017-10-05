const shell = require("shelljs");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const minimist = require("minimist");
const emoji = require("node-emoji");
const curl = require("curlrequest");
const unzipper = require("unzipper");
var prependFile = require("prepend-file");

const inbound =
  "https://hg.mozilla.org/integration/mozilla-inbound/archive/tip.zip/devtools/client";

/*
1. downloading the sources
2. save original files files
3. copy files to assets
4. update files
*/

function updateFile(filename, regex, text) {
  var data = fs.readFileSync(filename, "utf-8");
  var newValue = data.replace(regex, text);
  fs.writeFileSync(filename, newValue, "utf-8");
}

async function fetch(url) {
  return new Promise(resolve => {
    curl.request({ url, encoding: null }, function(err, file) {
      resolve(file);
    });
  });
}

async function fetchFile(url, zipPath, dirPath) {
  const file = await fetch(`${inbound}/${url}`);
  shell.exec(`mkdir -p zips`, { silent: true });
  fs.writeFileSync(zipPath, file);
  fs.createReadStream(zipPath).pipe(unzipper.Extract({ path: dirPath }));
}

function copyFiles() {
  shell.exec(`rm -rf ${assetsPath}`, { silent: true });
  shell.exec(`mkdir -p ${assetsPath}`, { silent: true });
  const out = shell.exec(`cp -r ${mcPath}/mozilla*/* ${assetsPath}`, {
    silent: true
  });
}

function updateFiles() {
  filesToUpdate.forEach(({ filename, regex, text }) =>
    updateFile(`${assetsPath}/${filename}`, regex, text)
  );
}

const mcPath = "mc";
const assetsPath = "assets";
const themesPath = `themes`;
const widgetsPath = `shared/widgets`;

const filesToUpdate = [
  {
    filename: "devtools/client/themes/light-theme.css",
    regex: /@import/,
    text: "@namespace theme-light;\n\n@import"
  },
  {
    filename: "devtools/client/themes/dark-theme.css",
    regex: /@import/,
    text: "@namespace theme-dark;\n\n@import"
  },
  {
    filename: "devtools/client/themes/firebug-theme.css",
    regex: /@import/,
    text: "@namespace theme-firebug;\n\n@import"
  }
];

async function main() {
  console.log(chalk.blue("Syncing with MC\n"));
  console.log(`${emoji.get(":watch:")} ${chalk.yellow("Downloading files")}`);

  await fetchFile(themesPath, "zips/themes.zip", "mc");
  await fetchFile(widgetsPath, "zips/widgets.zip", "mc");

  console.log(
    `${emoji.get(":honeybee:")} ${chalk.yellow("Copying files to assets")}`
  );

  copyFiles();

  console.log(`${emoji.get(":zap:")} ${chalk.yellow("Updating files")}`);
  updateFiles();
}

main();
