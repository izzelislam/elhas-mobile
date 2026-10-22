export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  nip: string | null;
  no_hp: string | null;
  foto: string | null;
  jabatan: string | null;
  is_active: boolean;
  pesantren_id: number;
  roles: string[];
  permissions: string[];
};

export type LoginResult = {
  token: string;
  user: AuthUser;
  message: string;
};

export type LoginResponse = {
  success: boolean;
  message: string;
  data: {user: AuthUser; token: string};
};

export type MeResponse = {
  success: boolean;
  message: string;
  data: AuthUser;
};
