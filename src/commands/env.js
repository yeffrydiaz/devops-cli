'use strict';

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { log, error, success, warn } = require('../utils/logger');

const DEFAULT_ENV_FILE = '.env';

const envCmd = new Command('env');

envCmd.description('Manage environment variables for your services');

/**
 * Set one or more environment variables in the .env file.
 */
envCmd
  .command('set <assignments...>')
  .description('Set environment variables (e.g., KEY=VALUE KEY2=VALUE2)')
  .option('-f, --file <file>', 'Path to .env file', DEFAULT_ENV_FILE)
  .action((assignments, options) => {
    const filePath = path.resolve(process.cwd(), options.file);
    const vars = loadEnvFile(filePath);

    for (const assignment of assignments) {
      const eqIndex = assignment.indexOf('=');
      if (eqIndex === -1) {
        error(`Invalid assignment "${assignment}". Use KEY=VALUE format.`);
        process.exit(1);
      }
      const key = assignment.slice(0, eqIndex).trim();
      const value = assignment.slice(eqIndex + 1).trim();

      if (!key) {
        error(`Empty key in "${assignment}".`);
        process.exit(1);
      }

      vars[key] = value;
      log(`Set ${chalk.cyan(key)}=${chalk.green(value)}`);
    }

    saveEnvFile(filePath, vars);
    success(`Environment variables saved to ${chalk.cyan(options.file)}.`);
  });

/**
 * Get the value of an environment variable.
 */
envCmd
  .command('get <key>')
  .description('Get the value of an environment variable')
  .option('-f, --file <file>', 'Path to .env file', DEFAULT_ENV_FILE)
  .action((key, options) => {
    const filePath = path.resolve(process.cwd(), options.file);
    const vars = loadEnvFile(filePath);

    if (!(key in vars)) {
      warn(`Variable ${chalk.cyan(key)} not found in ${options.file}.`);
      process.exit(1);
    }

    console.log(`${chalk.cyan(key)}=${chalk.green(vars[key])}`);
  });

/**
 * List all environment variables.
 */
envCmd
  .command('list')
  .description('List all environment variables')
  .option('-f, --file <file>', 'Path to .env file', DEFAULT_ENV_FILE)
  .action((options) => {
    const filePath = path.resolve(process.cwd(), options.file);
    const vars = loadEnvFile(filePath);
    const keys = Object.keys(vars);

    if (keys.length === 0) {
      log(`No variables found in ${chalk.cyan(options.file)}.`);
      return;
    }

    log(`Environment variables in ${chalk.cyan(options.file)}:`);
    for (const key of keys) {
      console.log(`  ${chalk.cyan(key)}=${chalk.green(vars[key])}`);
    }
  });

/**
 * Delete an environment variable.
 */
envCmd
  .command('delete <key>')
  .description('Delete an environment variable')
  .option('-f, --file <file>', 'Path to .env file', DEFAULT_ENV_FILE)
  .action((key, options) => {
    const filePath = path.resolve(process.cwd(), options.file);
    const vars = loadEnvFile(filePath);

    if (!(key in vars)) {
      warn(`Variable ${chalk.cyan(key)} not found in ${options.file}.`);
      process.exit(1);
    }

    delete vars[key];
    saveEnvFile(filePath, vars);
    success(`Variable ${chalk.cyan(key)} deleted from ${chalk.cyan(options.file)}.`);
  });

/**
 * Export environment variables to a file.
 */
envCmd
  .command('export')
  .description('Export environment variables to a .env file')
  .option('-f, --file <file>', 'Output .env file path', DEFAULT_ENV_FILE)
  .option('-s, --source <source>', 'Source .env file to export from', DEFAULT_ENV_FILE)
  .action((options) => {
    const sourcePath = path.resolve(process.cwd(), options.source);
    const vars = loadEnvFile(sourcePath);

    const destPath = path.resolve(process.cwd(), options.file);
    saveEnvFile(destPath, vars);
    success(`Exported ${Object.keys(vars).length} variable(s) to ${chalk.cyan(options.file)}.`);
  });

/**
 * Import environment variables from a file into the current environment.
 */
envCmd
  .command('import <file>')
  .description('Import environment variables from a .env file')
  .option('-o, --output <output>', 'Target .env file', DEFAULT_ENV_FILE)
  .action((file, options) => {
    const importPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(importPath)) {
      error(`File not found: ${importPath}`);
      process.exit(1);
    }

    const importedVars = parseEnvFile(fs.readFileSync(importPath, 'utf8'));
    const targetPath = path.resolve(process.cwd(), options.output);
    const targetVars = loadEnvFile(targetPath);

    const merged = { ...targetVars, ...importedVars };
    saveEnvFile(targetPath, merged);
    success(`Imported ${Object.keys(importedVars).length} variable(s) from ${chalk.cyan(file)} into ${chalk.cyan(options.output)}.`);
  });

/**
 * Load an env file, returning an object of key-value pairs.
 * Returns empty object if file does not exist.
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  return parseEnvFile(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Parse a .env file string into an object.
 */
function parseEnvFile(content) {
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (key) vars[key] = value;
  }
  return vars;
}

/**
 * Serialize env vars to .env file format and write to disk.
 */
function saveEnvFile(filePath, vars) {
  const lines = Object.entries(vars).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(filePath, lines.join('\n') + (lines.length > 0 ? '\n' : ''), 'utf8');
}

module.exports = envCmd;
module.exports.loadEnvFile = loadEnvFile;
module.exports.parseEnvFile = parseEnvFile;
module.exports.saveEnvFile = saveEnvFile;
