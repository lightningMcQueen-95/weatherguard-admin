import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SetLocationDto } from './dto/set-location.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { User } from '../common/schemas/user.schema';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // --- Self-service endpoints (any authenticated user) ---

  @Get('me')
  getMe(@CurrentUser() user: User) {
    return user;
  }

  @Patch('me/location')
  setMyLocation(@CurrentUser() user: User, @Body() dto: SetLocationDto) {
    return this.usersService.setLocation(user._id.toString(), dto);
  }

  @Post('me/telegram/link-token')
  createTelegramLink(@CurrentUser() user: User) {
    return this.usersService.generateTelegramLinkToken(user._id.toString()).then((token) => ({
      token,
      deepLink: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${token}`,
    }));
  }

  // --- Admin-only endpoints ---

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll() {
    return this.usersService.findAll();
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles('admin')
  findPending() {
    return this.usersService.findPending();
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
    return this.usersService.setStatus(id, dto.status);
  }
}
