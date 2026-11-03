import type { UserRole } from "@bakul/shared";

export type AuthRequestUser = {
  id: string;
  role: UserRole;
};
