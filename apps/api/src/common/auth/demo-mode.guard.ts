import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class DemoModeGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    if (process.env["DEMO_MODE"] !== "true") {
      throw new ForbiddenException({
        code: "DEMO_ONLY",
        message: "Fitur ini hanya aktif saat mode demo.",
      });
    }
    return true;
  }
}
