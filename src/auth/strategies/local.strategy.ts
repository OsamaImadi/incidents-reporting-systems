import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passReqToCallback: true, // This allows us to access the request object
    });
  }

  async validate(req: any, email: string, password: string): Promise<any> {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const user = await this.authService.validateUser(email, password, ipAddress, userAgent);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
