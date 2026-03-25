'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { interpolate, toKebabCase, copyTemplate } = require('../src/commands/scaffold');

describe('interpolate', () => {
  test('replaces {{VARIABLE}} placeholders', () => {
    expect(interpolate('Hello {{NAME}}!', { NAME: 'World' })).toBe('Hello World!');
  });

  test('leaves unknown placeholders unchanged', () => {
    expect(interpolate('Hello {{UNKNOWN}}!', {})).toBe('Hello {{UNKNOWN}}!');
  });

  test('replaces multiple occurrences', () => {
    expect(interpolate('{{A}} and {{B}}', { A: 'foo', B: 'bar' })).toBe('foo and bar');
  });

  test('handles string with no placeholders', () => {
    expect(interpolate('no placeholders', { KEY: 'value' })).toBe('no placeholders');
  });
});

describe('toKebabCase', () => {
  test('converts camelCase to kebab-case', () => {
    expect(toKebabCase('myService')).toBe('my-service');
  });

  test('converts spaces to hyphens', () => {
    expect(toKebabCase('my service name')).toBe('my-service-name');
  });

  test('converts underscores to hyphens', () => {
    expect(toKebabCase('my_service')).toBe('my-service');
  });

  test('lowercases the result', () => {
    expect(toKebabCase('MyService')).toBe('my-service');
  });

  test('handles already kebab-case strings', () => {
    expect(toKebabCase('my-service')).toBe('my-service');
  });
});

describe('copyTemplate', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devops-cli-scaffold-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('copies files from template to destination', () => {
    const srcDir = path.join(tmpDir, 'template');
    const destDir = path.join(tmpDir, 'output');
    fs.mkdirSync(srcDir);
    fs.writeFileSync(path.join(srcDir, 'file.txt'), 'content', 'utf8');

    copyTemplate(srcDir, destDir, {});

    expect(fs.existsSync(path.join(destDir, 'file.txt'))).toBe(true);
    expect(fs.readFileSync(path.join(destDir, 'file.txt'), 'utf8')).toBe('content');
  });

  test('interpolates placeholders in file contents', () => {
    const srcDir = path.join(tmpDir, 'template');
    const destDir = path.join(tmpDir, 'output');
    fs.mkdirSync(srcDir);
    fs.writeFileSync(path.join(srcDir, 'config.txt'), 'Service: {{SERVICE_NAME}}', 'utf8');

    copyTemplate(srcDir, destDir, { SERVICE_NAME: 'my-svc' });

    const content = fs.readFileSync(path.join(destDir, 'config.txt'), 'utf8');
    expect(content).toBe('Service: my-svc');
  });

  test('recursively copies subdirectories', () => {
    const srcDir = path.join(tmpDir, 'template');
    const subDir = path.join(srcDir, 'sub');
    const destDir = path.join(tmpDir, 'output');
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, 'nested.txt'), 'nested', 'utf8');

    copyTemplate(srcDir, destDir, {});

    expect(fs.existsSync(path.join(destDir, 'sub', 'nested.txt'))).toBe(true);
  });
});

describe('scaffold CLI commands (integration)', () => {
  const { execFileSync } = require('child_process');
  const CLI = path.resolve(__dirname, '..', 'bin', 'devops-cli.js');
  let tmpDir;

  function runScaffoldCmd(args, cwd) {
    try {
      const stdout = execFileSync(process.execPath, [CLI, 'scaffold', ...args], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd,
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

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devops-cli-scaffold-int-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('scaffold service creates a node microservice by default', () => {
    const result = runScaffoldCmd(['service', 'myService'], tmpDir);
    expect(result.exitCode).toBe(0);
    const serviceDir = path.join(tmpDir, 'my-service');
    expect(fs.existsSync(serviceDir)).toBe(true);
    expect(fs.existsSync(path.join(serviceDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(serviceDir, 'Dockerfile'))).toBe(true);
  });

  test('scaffold service creates a python microservice', () => {
    const result = runScaffoldCmd(['service', 'my-api', '--language', 'python'], tmpDir);
    expect(result.exitCode).toBe(0);
    const serviceDir = path.join(tmpDir, 'my-api');
    expect(fs.existsSync(serviceDir)).toBe(true);
    expect(fs.existsSync(path.join(serviceDir, 'app.py'))).toBe(true);
    expect(fs.existsSync(path.join(serviceDir, 'requirements.txt'))).toBe(true);
  });

  test('scaffold service creates a go microservice', () => {
    const result = runScaffoldCmd(['service', 'my-svc', '--language', 'go'], tmpDir);
    expect(result.exitCode).toBe(0);
    const serviceDir = path.join(tmpDir, 'my-svc');
    expect(fs.existsSync(serviceDir)).toBe(true);
    expect(fs.existsSync(path.join(serviceDir, 'main.go'))).toBe(true);
    expect(fs.existsSync(path.join(serviceDir, 'go.mod'))).toBe(true);
  });

  test('scaffold service interpolates SERVICE_NAME in files', () => {
    runScaffoldCmd(['service', 'test-service'], tmpDir);
    const pkgJson = path.join(tmpDir, 'test-service', 'package.json');
    const content = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
    expect(content.name).toBe('test-service');
  });

  test('scaffold service exits with error for unsupported language', () => {
    const result = runScaffoldCmd(['service', 'bad-lang', '--language', 'ruby'], tmpDir);
    expect(result.exitCode).not.toBe(0);
  });

  test('scaffold service exits with error if directory already exists', () => {
    runScaffoldCmd(['service', 'duplicate'], tmpDir);
    const result = runScaffoldCmd(['service', 'duplicate'], tmpDir);
    expect(result.exitCode).not.toBe(0);
  });

  test('scaffold list shows available templates', () => {
    const result = runScaffoldCmd(['list'], tmpDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('node');
    expect(result.stdout).toContain('python');
    expect(result.stdout).toContain('go');
  });

  test('scaffold service uses custom port', () => {
    runScaffoldCmd(['service', 'port-svc', '--port', '8080'], tmpDir);
    const dockerFile = path.join(tmpDir, 'port-svc', 'Dockerfile');
    const content = fs.readFileSync(dockerFile, 'utf8');
    expect(content).toContain('8080');
  });
});
