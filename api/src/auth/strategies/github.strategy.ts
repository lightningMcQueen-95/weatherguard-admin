import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get('GITHUB_CLIENT_ID'),
      clientSecret: config.get('GITHUB_CLIENT_SECRET'),
      callbackURL: config.get('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: any, done: Function): any {
    const { id, username, displayName, photos, emails } = profile;
    const user = {
      provider: 'github' as const,
      providerId: id,
      email: emails?.[0]?.value,
      name: displayName || username,
      avatarUrl: photos?.[0]?.value,
    };
    done(null, user);
  }
}
