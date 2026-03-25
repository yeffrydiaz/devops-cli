'use strict';

const { Command } = require('commander');
const deployCommand = require('./commands/deploy');
const envCommand = require('./commands/env');
const scaffoldCommand = require('./commands/scaffold');

const program = new Command();

program
  .name('devops')
  .description('DevOps CLI Toolkit - automate deployments, manage environment variables, and scaffold microservices')
  .version('1.0.0');

program.addCommand(deployCommand);
program.addCommand(envCommand);
program.addCommand(scaffoldCommand);

module.exports = { program };
