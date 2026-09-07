import * as net from 'net';
import * as dns from 'dns';
import { BadRequestException } from '@nestjs/common';

const TRUSTED_PUBLIC_HOSTS = new Set([
  'github.com',
  'gitlab.com',
  'bitbucket.org',
]);

const BANNED_HOST_KEYWORDS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'internal',
  'local',
  'arpa',
  'metadata',
  'instance-data',
];

/**
 * Validates whether an IP address belongs to private, loopback, link-local,
 * or cloud metadata reserved address blocks (RFC 1918, RFC 3927, RFC 6890).
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!net.isIP(ip)) {
    return false;
  }

  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    const [b0, b1] = parts;

    // 0.0.0.0/8 (Current network)
    if (b0 === 0) return true;

    // 10.0.0.0/8 (Private)
    if (b0 === 10) return true;

    // 127.0.0.0/8 (Loopback)
    if (b0 === 127) return true;

    // 169.254.0.0/16 (Link-local / Cloud metadata: 169.254.169.254)
    if (b0 === 169 && b1 === 254) return true;

    // 172.16.0.0/12 (Private: 172.16.0.0 - 172.31.255.255)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

    // 192.168.0.0/16 (Private)
    if (b0 === 192 && b1 === 168) return true;

    // 100.64.0.0/10 (Shared address space / Carrier-grade NAT)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

    // 198.18.0.0/15 (Benchmark network)
    if (b0 === 198 && (b1 === 18 || b1 === 19)) return true;

    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (b0 >= 224) return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();

    // ::1 (Loopback) or :: (Unspecified)
    if (normalized === '::1' || normalized === '::') return true;

    // IPv4-mapped IPv6: ::ffff:x.x.x.x
    if (normalized.startsWith('::ffff:')) {
      const ipv4Part = normalized.substring(7);
      if (net.isIPv4(ipv4Part)) {
        return isPrivateOrReservedIp(ipv4Part);
      }
    }

    // Unique Local Address (ULA): fc00::/7 (starts with fc or fd)
    if (/^f[cd]/i.test(normalized)) return true;

    // Link-Local: fe80::/10 (starts with fe8, fe9, fea, feb)
    if (/^fe[89ab]/i.test(normalized)) return true;

    // Multicast: ff00::/8
    if (normalized.startsWith('ff')) return true;

    return false;
  }

  return false;
}

/**
 * Validates a repository URL against SSRF attacks:
 * - Rejects non-HTTP/HTTPS/SSH schemes
 * - Rejects loopback, private RFC1918, link-local metadata (169.254.169.254)
 * - Resolves DNS and inspects resolved IP records
 */
export async function validateRepositoryUrl(rawUrl: string): Promise<void> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new BadRequestException('Repository URL must be provided');
  }

  const trimmed = rawUrl.trim();

  let hostname: string;
  let protocol = '';

  // 1. Handle SSH format (e.g. git@github.com:octocat/Hello-World.git)
  if (trimmed.startsWith('git@')) {
    const sshMatch = trimmed.match(/^git@([a-zA-Z0-9.\-_]+):/);
    if (!sshMatch) {
      throw new BadRequestException('Invalid SSH repository URL format');
    }
    hostname = sshMatch[1];
    protocol = 'ssh:';
  } else {
    // 2. Standard URL parsing (http:, https:)
    try {
      const parsed = new URL(trimmed);
      protocol = parsed.protocol;
      hostname = parsed.hostname;
    } catch {
      throw new BadRequestException('Invalid repository URL format');
    }

    if (protocol !== 'http:' && protocol !== 'https:') {
      throw new BadRequestException(
        `Unsupported protocol "${protocol}". Only HTTP, HTTPS, or SSH Git URLs are allowed.`,
      );
    }
  }

  const lowerHostname = hostname.toLowerCase();

  // Fast path for established public hosts
  if (
    TRUSTED_PUBLIC_HOSTS.has(lowerHostname) ||
    lowerHostname.endsWith('.github.com') ||
    lowerHostname.endsWith('.gitlab.com') ||
    lowerHostname.endsWith('.bitbucket.org')
  ) {
    return;
  }

  // Check explicit banned hostnames/keywords
  for (const keyword of BANNED_HOST_KEYWORDS) {
    if (lowerHostname === keyword || lowerHostname.endsWith(`.${keyword}`)) {
      throw new BadRequestException(
        'Repository URL points to a restricted or local host (SSRF protection)',
      );
    }
  }

  // If hostname is an IP literal
  if (net.isIP(lowerHostname)) {
    if (isPrivateOrReservedIp(lowerHostname)) {
      throw new BadRequestException(
        'Repository URL points to a private or reserved IP address (SSRF protection)',
      );
    }
    return;
  }

  // Perform DNS resolution to prevent DNS rebinding and internal network probing
  try {
    const records = await dns.promises.lookup(lowerHostname, { all: true });
    for (const record of records) {
      if (isPrivateOrReservedIp(record.address)) {
        throw new BadRequestException(
          `Repository host "${lowerHostname}" resolves to a private or restricted address (${record.address})`,
        );
      }
    }
  } catch (err) {
    if (err instanceof BadRequestException) {
      throw err;
    }
    throw new BadRequestException(
      `Failed to resolve repository host "${lowerHostname}": ${err.message}`,
    );
  }
}

/**
 * Validates branch names against Git flag injection and invalid ref naming:
 * - Cannot start with a hyphen or dash (avoids simple-git option injection)
 * - Cannot contain path traversal or git-restricted characters
 */
export function validateBranchName(branch?: string): void {
  if (!branch) return;

  const trimmed = branch.trim();

  // Disallow flag/option injection (-b, --upload-pack, etc.)
  if (trimmed.startsWith('-')) {
    throw new BadRequestException(
      'Branch name cannot start with a hyphen (option injection prevention)',
    );
  }

  if (trimmed.startsWith('/')) {
    throw new BadRequestException('Branch name cannot start with a slash');
  }

  // Regex enforcing valid git reference characters without options or traversals
  const INVALID_GIT_BRANCH_PATTERN =
    /(?:^\/|^-|--|\/\.|\.\.|\/\/|\.lock$|[\x00-\x1f\x7f ~^:?*\[\\]|\.$|\/$)/;

  if (INVALID_GIT_BRANCH_PATTERN.test(trimmed)) {
    throw new BadRequestException(
      `Invalid branch name "${trimmed}". Branch names cannot contain option flags, path traversal, or special git characters.`,
    );
  }
}
