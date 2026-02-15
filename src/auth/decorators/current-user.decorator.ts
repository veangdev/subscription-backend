import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Usage: @CurrentUser() user in any protected controller method
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // { id, email } set by JwtStrategy.validate()
  },
);
