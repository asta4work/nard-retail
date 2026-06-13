import { Role } from './role.type';

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export type UpdateUserPayload = Partial<CreateUserPayload & { active: boolean }>;
