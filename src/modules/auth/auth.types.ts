export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  source: "campaign" | "default" | "checkout";
}

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface CustomerAuthResponse {
  user: CustomerProfile;
  tokens: AuthTokens;
}

export interface AdminAuthResponse {
  user: AdminProfile;
  tokens: AuthTokens;
}

export interface MeResponse {
  role: "customer" | "admin";
  user: CustomerProfile | AdminProfile;
}
