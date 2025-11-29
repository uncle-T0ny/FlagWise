import { IsArray, IsString } from 'class-validator';

export class SetRulesDto {
  @IsArray()
  @IsString({ each: true })
  rules: string[];
}
