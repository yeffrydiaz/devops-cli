'use strict';

const { Command } = require('commander');
const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const { log, error, success, warn } = require('../utils/logger');

const deploy = new Command('deploy');

deploy
  .description('Automate Docker-based deployment tasks');

/**
 * Build a Docker image for the given service.
 */
deploy
  .command('build <service>')
  .description('Build a Docker image for the specified service')
  .option('-t, --tag <tag>', 'Docker image tag', 'latest')
  .option('-f, --file <dockerfile>', 'Path to Dockerfile', 'Dockerfile')
  .option('--no-cache', 'Build without using cache')
  .action((service, options) => {
    const tag = `${service}:${options.tag}`;
    const dockerfile = options.file;
    const noCache = options.cache === false ? '--no-cache' : '';

    log(`Building Docker image ${chalk.cyan(tag)} from ${chalk.cyan(dockerfile)}...`);

    const args = ['build', '-t', tag, '-f', dockerfile];
    if (noCache) args.push('--no-cache');
    args.push('.');

    const result = runCommand('docker', args);
    if (result.status !== 0) {
      error(`Failed to build image ${tag}: ${result.stderr}`);
      process.exit(1);
    }
    success(`Docker image ${chalk.cyan(tag)} built successfully.`);
  });

/**
 * Push a Docker image to a registry.
 */
deploy
  .command('push <service>')
  .description('Push a Docker image to a container registry')
  .option('-t, --tag <tag>', 'Docker image tag', 'latest')
  .option('-r, --registry <registry>', 'Container registry URL')
  .action((service, options) => {
    let imageName = `${service}:${options.tag}`;
    if (options.registry) {
      imageName = `${options.registry}/${imageName}`;
    }

    log(`Pushing Docker image ${chalk.cyan(imageName)}...`);

    const result = runCommand('docker', ['push', imageName]);
    if (result.status !== 0) {
      error(`Failed to push image ${imageName}: ${result.stderr}`);
      process.exit(1);
    }
    success(`Docker image ${chalk.cyan(imageName)} pushed successfully.`);
  });

/**
 * Run a deployment script for the given service.
 */
deploy
  .command('run <service>')
  .description('Run the deployment script for the specified service')
  .option('-e, --env <environment>', 'Target environment (staging|production)', 'staging')
  .option('-s, --script <script>', 'Path to deployment script', 'deploy.sh')
  .action((service, options) => {
    const { env: environment, script } = options;

    if (!['staging', 'production'].includes(environment)) {
      error(`Invalid environment "${environment}". Use "staging" or "production".`);
      process.exit(1);
    }

    const scriptPath = path.resolve(process.cwd(), script);
    if (!fs.existsSync(scriptPath)) {
      error(`Deployment script not found: ${scriptPath}`);
      process.exit(1);
    }

    log(`Deploying ${chalk.cyan(service)} to ${chalk.yellow(environment)} using ${chalk.cyan(script)}...`);

    const result = runCommand('bash', [scriptPath, service, environment]);
    if (result.status !== 0) {
      error(`Deployment failed for ${service}: ${result.stderr}`);
      process.exit(1);
    }
    success(`Service ${chalk.cyan(service)} deployed to ${chalk.yellow(environment)} successfully.`);
  });

/**
 * Run a command and return { status, stdout, stderr }.
 * Uses spawnSync for testability.
 */
function runCommand(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...opts,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return {
    status: result.status === null ? 1 : result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

module.exports = deploy;
module.exports.runCommand = runCommand;
