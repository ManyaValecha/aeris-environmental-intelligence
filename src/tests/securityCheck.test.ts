import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Security Audit & Credential Protection', () => {
  it('ensures no hardcoded AWS access keys or secret keys exist in source files', () => {
    const srcDir = path.join(__dirname, '..');
    const infraDir = path.join(__dirname, '../../infra');

    const checkDirectory = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git' || entry.name === 'cdk.out') {
          continue;
        }
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDirectory(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.json'))) {
          const content = fs.readFileSync(fullPath, 'utf-8');

          // Check for hardcoded AWS Access Key ID pattern: AKIA[0-9A-Z]{16}
          const awsKeyRegex = /AKIA[0-9A-Z]{16}/g;
          expect(awsKeyRegex.test(content), `Hardcoded AWS Access Key ID found in ${fullPath}`).toBe(false);

          // Check for generic secret key assignment patterns
          const secretAssignmentRegex = /(?:aws_secret_access_key|secret_key|private_key)\s*=\s*['"][A-Za-z0-9/+=]{20,}['"]/i;
          expect(secretAssignmentRegex.test(content), `Hardcoded AWS Secret Key assignment found in ${fullPath}`).toBe(false);
        }
      }
    };

    checkDirectory(srcDir);
    checkDirectory(infraDir);
  });

  it('verifies VITE_* environment variables do not expose sensitive AWS credentials', () => {
    const viteVars = Object.keys(import.meta.env).filter((k) => k.startsWith('VITE_'));
    const forbiddenSubstrings = ['SECRET', 'PRIVATE_KEY', 'ACCESS_KEY', 'PASSWORD', 'TOKEN'];

    for (const v of viteVars) {
      for (const sub of forbiddenSubstrings) {
        expect(v.includes(sub), `Potentially sensitive variable exposed in VITE client bundle: ${v}`).toBe(false);
      }
    }
  });
});
