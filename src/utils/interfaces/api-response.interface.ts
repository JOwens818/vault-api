export interface UserResponseData {
  token?: string;
  username: string;
  email: string;
}

export interface ApiResponse {
  status: string;
}

export interface UserResponse extends ApiResponse {
  data: UserResponseData;
}
