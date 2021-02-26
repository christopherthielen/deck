#!/usr/bin/env node
/* @ts-check */
/* eslint-disable no-console */

/* Copies dependency versions from Deck's root package.json (../../package.json) */

const fs = require(`fs`);
const path = require(`path`);
const yargs = require('yargs');

const args = yargs.argv._;
const targetPackageJson = path.resolve(args[0] || 'package.json');

const getPath = (string) => path.resolve(__dirname, ...string.split('/'));
const parse = (path) => JSON.parse(fs.readFileSync(path).toString());

const deckPackageJson = parse(getPath('../../package.json'));
// { [package]: version } from deck's package.json
const versionsFromDeck = {
  ...deckPackageJson.peerDependencies,
  ...deckPackageJson.devDependencies,
  ...deckPackageJson.dependencies,
};

const getDesiredVersion = (pkgName) => {
  switch (pkgName) {
    case '@spinnaker/core':
      return parse(getPath('../../app/scripts/modules/core/package.json')).version;
    case '@spinnaker/eslint':
      return parse(getPath('../eslint-plugin/package.json')).version;
    default:
      return versionsFromDeck[pkgName];
  }
};

const packageJson = parse(targetPackageJson);
const keys = ['dependencies', 'peerDependencies', 'devDependencies'];
keys.forEach((key) => {
  Object.keys(packageJson[key] || {}).forEach((pkgName) => {
    packageJson[key][pkgName] = getDesiredVersion(pkgName) || packageJson[key][pkgName];
  });
});

fs.writeFileSync(
  targetPackageJson,
  JSON.stringify(packageJson, null, 2).replace(/{\s*"dev": true\s*}/g, `{ "dev": true }`),
);

console.log(`Synchronized dependencies in ${targetPackageJson} from Deck`);
