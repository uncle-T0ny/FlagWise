import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Community } from './entities/community.entity';
import { CreateCommunityDto } from './dto/create-community.dto';
import { SetRulesDto } from './dto/set-rules.dto';
import { CerebrasService } from '../cerebras/cerebras.service';

@Injectable()
export class CommunityService {
  private communities: Map<string, Community> = new Map();

  constructor(private cerebrasService: CerebrasService) {}

  create(createCommunityDto: CreateCommunityDto): Community {
    if (this.communities.has(createCommunityDto.id)) {
      throw new ConflictException(`Community with id ${createCommunityDto.id} already exists`);
    }

    const community = new Community(createCommunityDto.id, createCommunityDto.rules);
    this.communities.set(community.id, community);
    return community;
  }

  findOne(id: string): Community {
    const community = this.communities.get(id);
    if (!community) {
      throw new NotFoundException(`Community with id ${id} not found`);
    }
    return community;
  }

  setRules(id: string, setRulesDto: SetRulesDto): Community {
    const community = this.findOne(id);
    community.rules = setRulesDto.rules;
    return community;
  }

  async checkMessage(id: string, message: string): Promise<{ isValid: boolean; violatedRule?: string }> {
    const community = this.findOne(id);

    if (community.rules.length === 0) {
      return { isValid: true };
    }

    return this.cerebrasService.validateMessage(message, community.rules);
  }

  findAll(): Community[] {
    return Array.from(this.communities.values());
  }
}
