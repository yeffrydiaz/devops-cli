#!/usr/bin/env node

'use strict';

const { program } = require('../src/index');

program.parseAsync(process.argv).catch((err) => {
  const chalk = require('chalk');
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});
