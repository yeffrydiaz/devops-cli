'use strict';

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { log, error, success, warn } = require('../utils/logger');

const SUPPORTED_LANGUAGES = ['node', 'python', 'go'];
const TEMPLATES_DIR = path.resolve(__dirname, '..', '..', 'templates');

const scaffold = new Command('scaffold');

scaffold.description('Scaffold new microservices from templates');

/**
 * Scaffold a new microservice.
 */
scaffold
  .command('service <name>')
  .description('Create a new microservice from a template')
  .option('-l, --language <language>', `Service language (${SUPPORTED_LANGUAGES.join('|')})`, 'node')
  .option('-o, --output <dir>', 'Output directory', '.')
  .option('--port <port>', 'Service port', '3000')
  .action((name, options) => {
    const { language, output, port } = options;

    if (!SUPPORTED_LANGUAGES.includes(language)) {
      error(`Unsupported language "${language}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`);
      process.exit(1);
    }

    const serviceName = toKebabCase(name);
    const destDir = path.resolve(process.cwd(), output, serviceName);

    if (fs.existsSync(destDir)) {
      error(`Directory already exists: ${destDir}`);
      process.exit(1);
    }

    const templateDir = path.join(TEMPLATES_DIR, language);
    if (!fs.existsSync(templateDir)) {
      error(`Template not found for language: ${language}`);
      process.exit(1);
    }

    log(`Scaffolding ${chalk.cyan(language)} microservice ${chalk.cyan(serviceName)}...`);

    const context = {
      SERVICE_NAME: serviceName,
      SERVICE_PORT: port,
      SERVICE_LANGUAGE: language,
    };

    copyTemplate(templateDir, destDir, context);

    success(`Microservice ${chalk.cyan(serviceName)} created at ${chalk.cyan(destDir)}.`);
    log('');
    log('Next steps:');
    log(`  cd ${serviceName}`);
    if (language === 'node') {
      log('  npm install');
      log('  npm start');
    } else if (language === 'python') {
      log('  pip install -r requirements.txt');
      log('  python app.py');
    } else if (language === 'go') {
      log('  go mod download');
      log('  go run main.go');
    }
  });

/**
 * List available templates.
 */
scaffold
  .command('list')
  .description('List available scaffold templates')
  .action(() => {
    if (!fs.existsSync(TEMPLATES_DIR)) {
      warn('No templates directory found.');
      return;
    }

    const templates = fs.readdirSync(TEMPLATES_DIR).filter((entry) =>
      fs.statSync(path.join(TEMPLATES_DIR, entry)).isDirectory()
    );

    if (templates.length === 0) {
      log('No templates available.');
      return;
    }

    log('Available templates:');
    for (const template of templates) {
      console.log(`  - ${chalk.cyan(template)}`);
    }
  });

/**
 * Recursively copy template files to destination, substituting context variables.
 */
function copyTemplate(srcDir, destDir, context) {
  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir);
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry);
    const destEntry = interpolate(entry, context);
    const destPath = path.join(destDir, destEntry);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyTemplate(srcPath, destPath, context);
    } else {
      const content = fs.readFileSync(srcPath, 'utf8');
      fs.writeFileSync(destPath, interpolate(content, context), 'utf8');
    }
  }
}

/**
 * Replace {{VARIABLE}} placeholders in a string with context values.
 */
function interpolate(str, context) {
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return key in context ? context[key] : match;
  });
}

/**
 * Convert a string to kebab-case.
 */
function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

module.exports = scaffold;
module.exports.copyTemplate = copyTemplate;
module.exports.interpolate = interpolate;
module.exports.toKebabCase = toKebabCase;
