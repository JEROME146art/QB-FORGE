export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'FACULTY' | 'STUDENT';
  departmentId?: string;
  college?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}