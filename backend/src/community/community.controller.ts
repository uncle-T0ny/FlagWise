import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { SetRulesDto } from './dto/set-rules.dto';
import { CheckMessageDto } from './dto/check-message.dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post()
  create(@Body() createCommunityDto: CreateCommunityDto) {
    return this.communityService.create(createCommunityDto);
  }

  @Get()
  findAll() {
    return this.communityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.communityService.findOne(id);
  }

  @Post(':id/rules')
  setRules(@Param('id') id: string, @Body() setRulesDto: SetRulesDto) {
    return this.communityService.setRules(id, setRulesDto);
  }

  @Post(':id/check')
  @HttpCode(HttpStatus.OK)
  async checkMessage(@Param('id') id: string, @Body() checkMessageDto: CheckMessageDto) {
    return this.communityService.checkMessage(id, checkMessageDto.message);
  }
}
