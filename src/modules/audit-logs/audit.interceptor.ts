import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { tap } from 'rxjs';
import { AuditLogsService } from './audit-logs.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  constructor(private audit: AuditLogsService) {}

  intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next.handle();

    return next.handle().pipe(
      tap((res) => {
        // writing the log must never break the request
        this.audit.fromRequest(req, res).catch((e) => this.logger.warn(`Could not write audit log: ${e.message}`));
      }),
    );
  }
}
