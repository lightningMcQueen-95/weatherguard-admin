import { IsNumber, IsString } from 'class-validator';

export class SetLocationDto {
  @IsString()
  name: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lon: number;
}
