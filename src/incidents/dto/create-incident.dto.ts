import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, IsInt } from 'class-validator';
import { Severity } from 'src/utils/severity.enum';

export class CreateIncidentDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  httpResponse?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(Severity)
  @IsOptional()
  severity?: Severity;

  @IsInt()
  @IsOptional()
  createdByUserId?: number;

  @IsString()
  @IsOptional()
  screenshotUrl?: string;
}
