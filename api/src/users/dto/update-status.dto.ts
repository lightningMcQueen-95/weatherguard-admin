import { IsIn } from 'class-validator';

export class UpdateStatusDto {
  @IsIn(['approved', 'rejected', 'pending'])
  status: 'approved' | 'rejected' | 'pending';
}
