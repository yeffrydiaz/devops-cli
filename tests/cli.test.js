'use strict';

const { execFileSync } = require('child_process');
const path = require('path');

const CLI = path.resolve(__dirname, '..', 'bin', 'devops-cli.js');

function runCLI(args) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, ...args], {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.status || 1,
    };
  }
}

describe('devops CLI', () => {
  test('shows help with --help', () => {
    const { stdout, exitCode } = runCLI(['--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('DevOps CLI Toolkit');
    expect(stdout).toContain('deploy');
    expect(stdout).toContain('env');
    expect(stdout).toContain('scaffold');
  });

  test('shows version with --version', () => {
    const { stdout, exitCode } = runCLI(['--version']);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('shows help for deploy command', () => {
    const { stdout, exitCode } = runCLI(['deploy', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('build');
    expect(stdout).toContain('push');
    expect(stdout).toContain('run');
  });

  test('shows help for env command', () => {
    const { stdout, exitCode } = runCLI(['env', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('set');
    expect(stdout).toContain('get');
    expect(stdout).toContain('list');
    expect(stdout).toContain('delete');
    expect(stdout).toContain('import');
    expect(stdout).toContain('export');
  });

  test('shows help for scaffold command', () => {
    const { stdout, exitCode } = runCLI(['scaffold', '--help']);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('service');
    expect(stdout).toContain('list');
  });
});
