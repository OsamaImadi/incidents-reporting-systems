export class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    username: string;
    email: string;
    userType: string;
  };
}
