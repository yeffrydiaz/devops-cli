'use strict';

const chalk = require('chalk');

const LEVELS = {
  info: chalk.blue('[INFO]'),
  success: chalk.green('[SUCCESS]'),
  warn: chalk.yellow('[WARN]'),
  error: chalk.red('[ERROR]'),
};

function log(message) {
  console.log(`${LEVELS.info} ${message}`);
}

function success(message) {
  console.log(`${LEVELS.success} ${message}`);
}

function warn(message) {
  console.warn(`${LEVELS.warn} ${message}`);
}

function error(message) {
  console.error(`${LEVELS.error} ${message}`);
}

module.exports = { log, success, warn, error };
