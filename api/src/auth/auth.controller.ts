import { Controller, Get, Req, Res, UseGuards, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard, GithubAuthGuard } from './strategies/oauth.guards';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Redirect handled by passport-google-oauth20
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    return this.completeLogin(req, res);
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {
    // Redirect handled by passport-github2
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    return this.completeLogin(req, res);
  }

  private async completeLogin(req: Request, res: Response) {
    const profile = req.user as any;
    const user = await this.authService.findOrCreateFromOAuth(profile);
    const token = this.authService.issueJwt(user._id.toString());

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${this.config.get('ADMIN_URL')}/dashboard`);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res() res: Response) {
    res.clearCookie('access_token');
    return res.json({ success: true });
  }
}
