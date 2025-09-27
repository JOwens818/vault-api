export interface UserResponseData {
  token?: string;
  username: string;
  id: string;
  email: string;
}

export interface ApiResponse {
  status: string;
}

export interface UserResponse extends ApiResponse {
  data: UserResponseData;
}
