import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Response } from 'express';
import {
  getAuthCookieOptions,
  getClearCookieOptions,
} from '../constants/cookie.config';

@Injectable()
export class AuthCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap((data) => {
        if (data && data.accessToken) {
          const res = context.switchToHttp().getResponse<Response>();
          res.cookie('token', data.accessToken, getAuthCookieOptions());
        }
      }),
    );
  }
}

@Injectable()
export class ClearCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        res.clearCookie('token', getClearCookieOptions());
      }),
    );
  }
}

