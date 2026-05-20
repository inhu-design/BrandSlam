import { createHash } from 'crypto';

/** @param {string} str */
export function inicisSha256(str) {
  return createHash('sha256').update(str, 'utf8').digest('hex');
}
