import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";

interface OAuthProfile {
  provider: "google" | "github";
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  /**
   * Finds an existing user by (provider, providerId) or creates a new one
   * in `pending` status. New sign-ups always start pending — there is no
   * code path that creates a user as already approved.
   */
  async findOrCreateFromOAuth(profile: OAuthProfile) {
    // First try matching by provider + providerId (exact match)
    let user = await this.usersService.findByProviderId(
      profile.provider,
      profile.providerId
    );

    if (!user) {
      // Fallback: match by email so the same person can use Google AND GitHub
      user = await this.usersService.findByEmail(profile.email);
    }

    if (!user) {
      // Genuinely new user — create them as pending
      user = await this.usersService.createFromOAuth(profile);
    }

    return user;
  }

  issueJwt(userId: string) {
    return this.jwtService.sign({ sub: userId });
  }
}
