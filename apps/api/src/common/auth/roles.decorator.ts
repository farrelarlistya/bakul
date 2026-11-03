import { SetMetadata } from "@nestjs/common";
import type { UserRole } from "@bakul/shared";

export const ROLES_KEY = "bakul:roles";

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
