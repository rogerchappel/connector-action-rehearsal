export const MINIMUM_NODE_MAJOR = 22;

export function nodeVersionError(version: string): string | undefined {
  const match = /^v?(\d+)\./.exec(version);
  if (!match || Number(match[1]) < MINIMUM_NODE_MAJOR) {
    return `Node.js ${MINIMUM_NODE_MAJOR} or newer is required (running ${version}).`;
  }
  return undefined;
}
