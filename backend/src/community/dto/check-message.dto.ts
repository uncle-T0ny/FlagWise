import { IsString, IsNotEmpty } from 'class-validator';

export class CheckMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}
