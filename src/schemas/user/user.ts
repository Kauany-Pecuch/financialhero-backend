export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  wage?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}