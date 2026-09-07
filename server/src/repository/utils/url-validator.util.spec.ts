import { BadRequestException } from '@nestjs/common';
import {
  isPrivateOrReservedIp,
  validateRepositoryUrl,
  validateBranchName,
} from './url-validator.util';

describe('url-validator.util', () => {
  describe('isPrivateOrReservedIp()', () => {
    it('should identify IPv4 loopback and private ranges as private', () => {
      expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('127.255.255.255')).toBe(true);
      expect(isPrivateOrReservedIp('10.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('10.254.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('172.31.255.255')).toBe(true);
      expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true);
      expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true); // AWS/GCP metadata
      expect(isPrivateOrReservedIp('0.0.0.0')).toBe(true);
      expect(isPrivateOrReservedIp('100.64.0.1')).toBe(true);
    });

    it('should identify public IPv4 addresses as non-private', () => {
      expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
      expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false);
      expect(isPrivateOrReservedIp('140.82.121.4')).toBe(false); // GitHub
      expect(isPrivateOrReservedIp('172.15.0.1')).toBe(false);
      expect(isPrivateOrReservedIp('172.32.0.1')).toBe(false);
    });

    it('should identify IPv6 loopback, private, and metadata ranges', () => {
      expect(isPrivateOrReservedIp('::1')).toBe(true);
      expect(isPrivateOrReservedIp('::')).toBe(true);
      expect(isPrivateOrReservedIp('fc00::1')).toBe(true);
      expect(isPrivateOrReservedIp('fd12:3456:789a::1')).toBe(true);
      expect(isPrivateOrReservedIp('fe80::1')).toBe(true);
      expect(isPrivateOrReservedIp('::ffff:127.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('::ffff:169.254.169.254')).toBe(true);
    });

    it('should return false for non-IP strings', () => {
      expect(isPrivateOrReservedIp('not-an-ip')).toBe(false);
      expect(isPrivateOrReservedIp('')).toBe(false);
    });
  });

  describe('validateRepositoryUrl()', () => {
    it('should allow trusted public code hosting domains immediately', async () => {
      await expect(
        validateRepositoryUrl('https://github.com/octocat/Hello-World.git'),
      ).resolves.not.toThrow();

      await expect(
        validateRepositoryUrl('https://gitlab.com/group/project.git'),
      ).resolves.not.toThrow();

      await expect(
        validateRepositoryUrl('https://bitbucket.org/user/repo.git'),
      ).resolves.not.toThrow();

      await expect(
        validateRepositoryUrl('git@github.com:octocat/Hello-World.git'),
      ).resolves.not.toThrow();
    });

    it('should reject local/loopback/cloud metadata hostnames', async () => {
      await expect(
        validateRepositoryUrl('http://localhost:3000/repo.git'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        validateRepositoryUrl('http://127.0.0.1:8080/repo.git'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        validateRepositoryUrl('http://169.254.169.254/latest/meta-data'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        validateRepositoryUrl('http://metadata.google.internal/computeMetadata/v1/'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        validateRepositoryUrl('http://db.internal:5432/repo.git'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject non-HTTP/SSH protocols like file:// or gopher://', async () => {
      await expect(
        validateRepositoryUrl('file:///etc/passwd'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        validateRepositoryUrl('gopher://127.0.0.1:70/'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        validateRepositoryUrl('ftp://example.com/repo.git'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateBranchName()', () => {
    it('should allow standard valid branch names', () => {
      expect(() => validateBranchName('main')).not.toThrow();
      expect(() => validateBranchName('master')).not.toThrow();
      expect(() => validateBranchName('feature/user-auth_v2')).not.toThrow();
      expect(() => validateBranchName('release/1.0.0')).not.toThrow();
      expect(() => validateBranchName(undefined)).not.toThrow();
    });

    it('should reject branch names starting with a hyphen (flag injection)', () => {
      expect(() => validateBranchName('--upload-pack=exploit')).toThrow(
        BadRequestException,
      );
      expect(() => validateBranchName('-b')).toThrow(BadRequestException);
    });

    it('should reject branch names starting with slash or containing path traversal', () => {
      expect(() => validateBranchName('/main')).toThrow(BadRequestException);
      expect(() => validateBranchName('feature/../main')).toThrow(BadRequestException);
      expect(() => validateBranchName('feature//branch')).toThrow(BadRequestException);
      expect(() => validateBranchName('branch.lock')).toThrow(BadRequestException);
      expect(() => validateBranchName('feature~1')).toThrow(BadRequestException);
      expect(() => validateBranchName('feature^1')).toThrow(BadRequestException);
      expect(() => validateBranchName('feat:bug')).toThrow(BadRequestException);
      expect(() => validateBranchName('feat?')).toThrow(BadRequestException);
      expect(() => validateBranchName('feat*')).toThrow(BadRequestException);
      expect(() => validateBranchName('feat[1]')).toThrow(BadRequestException);
      expect(() => validateBranchName('feat name with spaces')).toThrow(BadRequestException);
    });
  });
});
