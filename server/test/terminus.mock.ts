import { Module } from '@nestjs/common';

export class HealthCheckService {
  async check(checks: Array<() => unknown>) {
    await Promise.all(checks.map((check) => check()));
    return { status: 'ok' };
  }
}

export class PrismaHealthIndicator {
  pingCheck(name: string) {
    return { [name]: { status: 'up' } };
  }
}

export function HealthCheck() {
  return () => undefined;
}

@Module({
  providers: [HealthCheckService, PrismaHealthIndicator],
  exports: [HealthCheckService, PrismaHealthIndicator],
})
export class TerminusModule {}