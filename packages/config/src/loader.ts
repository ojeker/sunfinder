import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { root, type RootConfig } from './schema';

export class ConfigError extends Error {
  readonly issues?: string[];

  constructor(message: string, issues?: string[]) {
    super(message);
    this.issues = issues;
  }
}

export function parseWebcamsYaml(content: string): RootConfig {
  let data: unknown;
  try {
    data = parse(content);
  } catch (error) {
    throw new ConfigError('Failed to parse YAML.');
  }

  const result = root.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map(issue => issue.message);
    throw new ConfigError('Invalid webcam configuration.', issues);
  }

  return result.data;
}

export async function loadWebcamsYaml(path: string): Promise<RootConfig> {
  try {
    const content = await readFile(path, 'utf8');
    return parseWebcamsYaml(content);
  } catch (error) {
    if (error instanceof ConfigError) {
      throw error;
    }
    throw new ConfigError(`Failed to load config at ${path}.`);
  }
}
