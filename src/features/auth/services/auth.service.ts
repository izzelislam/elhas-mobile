import {http} from '@/services/api/client';
import type {AuthUser, LoginPayload, LoginResponse, LoginResult, MeResponse} from '../types';

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const {data} = await http.post<LoginResponse>('/auth/login', payload);
  return {token: data.data.token, user: data.data.user, message: data.message};
}

export async function getMe(): Promise<AuthUser> {
  const {data} = await http.get<MeResponse>('/auth/me');
  return data.data;
}
