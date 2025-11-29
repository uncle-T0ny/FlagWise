import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rules?: string[];
}
