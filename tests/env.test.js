'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { loadEnvFile, parseEnvFile, saveEnvFile } = require('../src/commands/env');

describe('parseEnvFile', () => {
  test('parses key=value pairs', () => {
    const content = 'KEY1=value1\nKEY2=value2\n';
    expect(parseEnvFile(content)).toEqual({ KEY1: 'value1', KEY2: 'value2' });
  });

  test('ignores comment lines', () => {
    const content = '# this is a comment\nKEY=value\n';
    expect(parseEnvFile(content)).toEqual({ KEY: 'value' });
  });

  test('ignores blank lines', () => {
    const content = '\nKEY=value\n\n';
    expect(parseEnvFile(content)).toEqual({ KEY: 'value' });
  });

  test('strips surrounding quotes from values', () => {
    const content = 'KEY1="quoted"\nKEY2=\'single\'\n';
    expect(parseEnvFile(content)).toEqual({ KEY1: 'quoted', KEY2: 'single' });
  });

  test('ignores lines without equals sign', () => {
    const content = 'INVALID\nKEY=value\n';
    expect(parseEnvFile(content)).toEqual({ KEY: 'value' });
  });

  test('handles empty file', () => {
    expect(parseEnvFile('')).toEqual({});
  });

  test('handles values containing equals signs', () => {
    const content = 'KEY=val=with=equals\n';
    expect(parseEnvFile(content)).toEqual({ KEY: 'val=with=equals' });
  });
});

describe('loadEnvFile', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devops-cli-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns empty object when file does not exist', () => {
    const result = loadEnvFile(path.join(tmpDir, 'nonexistent.env'));
    expect(result).toEqual({});
  });

  test('loads variables from existing file', () => {
    const filePath = path.join(tmpDir, '.env');
    fs.writeFileSync(filePath, 'DB_HOST=localhost\nDB_PORT=5432\n', 'utf8');
    expect(loadEnvFile(filePath)).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
  });
});

describe('saveEnvFile', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devops-cli-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('writes variables in KEY=VALUE format', () => {
    const filePath = path.join(tmpDir, '.env');
    saveEnvFile(filePath, { KEY1: 'val1', KEY2: 'val2' });
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toContain('KEY1=val1');
    expect(content).toContain('KEY2=val2');
  });

  test('creates the file if it does not exist', () => {
    const filePath = path.join(tmpDir, 'new.env');
    saveEnvFile(filePath, { NEW_KEY: 'new_value' });
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('writes an empty file for empty vars', () => {
    const filePath = path.join(tmpDir, 'empty.env');
    saveEnvFile(filePath, {});
    const content = fs.readFileSync(filePath, 'utf8');
    expect(content).toBe('');
  });

  test('round-trips correctly through save and load', () => {
    const filePath = path.join(tmpDir, '.env');
    const original = { HOST: 'localhost', PORT: '8080', DEBUG: 'true' };
    saveEnvFile(filePath, original);
    const loaded = loadEnvFile(filePath);
    expect(loaded).toEqual(original);
  });
});

describe('env CLI commands (integration)', () => {
  const { execFileSync } = require('child_process');
  const CLI = path.resolve(__dirname, '..', 'bin', 'devops-cli.js');
  let tmpDir;

  function runEnvCmd(args, cwd) {
    try {
      const stdout = execFileSync(process.execPath, [CLI, 'env', ...args], {
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
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devops-cli-env-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('set creates a .env file with the given variable', () => {
    const result = runEnvCmd(['set', 'FOO=bar'], tmpDir);
    expect(result.exitCode).toBe(0);
    const envFile = path.join(tmpDir, '.env');
    expect(fs.existsSync(envFile)).toBe(true);
    const vars = loadEnvFile(envFile);
    expect(vars.FOO).toBe('bar');
  });

  test('set multiple variables at once', () => {
    const result = runEnvCmd(['set', 'A=1', 'B=2', 'C=3'], tmpDir);
    expect(result.exitCode).toBe(0);
    const vars = loadEnvFile(path.join(tmpDir, '.env'));
    expect(vars).toMatchObject({ A: '1', B: '2', C: '3' });
  });

  test('get returns the value of a set variable', () => {
    runEnvCmd(['set', 'MY_KEY=hello'], tmpDir);
    const result = runEnvCmd(['get', 'MY_KEY'], tmpDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('MY_KEY');
    expect(result.stdout).toContain('hello');
  });

  test('get exits with error for missing variable', () => {
    const result = runEnvCmd(['get', 'MISSING_VAR'], tmpDir);
    expect(result.exitCode).not.toBe(0);
  });

  test('list shows all variables', () => {
    runEnvCmd(['set', 'K1=v1', 'K2=v2'], tmpDir);
    const result = runEnvCmd(['list'], tmpDir);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('K1');
    expect(result.stdout).toContain('K2');
  });

  test('delete removes a variable', () => {
    runEnvCmd(['set', 'DEL_ME=yes'], tmpDir);
    const deleteResult = runEnvCmd(['delete', 'DEL_ME'], tmpDir);
    expect(deleteResult.exitCode).toBe(0);
    const vars = loadEnvFile(path.join(tmpDir, '.env'));
    expect(vars.DEL_ME).toBeUndefined();
  });

  test('delete exits with error for missing variable', () => {
    const result = runEnvCmd(['delete', 'NOT_THERE'], tmpDir);
    expect(result.exitCode).not.toBe(0);
  });

  test('set rejects invalid assignment format', () => {
    const result = runEnvCmd(['set', 'INVALID_NO_EQUALS'], tmpDir);
    expect(result.exitCode).not.toBe(0);
  });

  test('import merges variables from another file', () => {
    const sourceFile = path.join(tmpDir, 'source.env');
    fs.writeFileSync(sourceFile, 'IMPORTED=yes\nANOTHER=val\n', 'utf8');
    const result = runEnvCmd(['import', 'source.env'], tmpDir);
    expect(result.exitCode).toBe(0);
    const vars = loadEnvFile(path.join(tmpDir, '.env'));
    expect(vars.IMPORTED).toBe('yes');
    expect(vars.ANOTHER).toBe('val');
  });
});
