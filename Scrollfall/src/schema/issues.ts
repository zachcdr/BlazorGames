import type { ZodIssue } from 'zod';

export function formatIssue(issue: ZodIssue): string {
  const path = issue.path.join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}
