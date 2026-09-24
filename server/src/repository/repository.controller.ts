import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CalculateRepoDto } from './dto/calculate-repo.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateRepoDto } from './dto/create-repo.dto';
import { RepositoryService } from './repository.service';

@ApiTags('Repository')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('repository')
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

  @Post('calculate-credits')
  @ApiOperation({
    summary: 'Estimate credits required to index a repository',
  })
  @ApiResponse({
    status: 200,
    description: 'Repository size and required credits calculated',
  })
  @ApiResponse({ status: 400, description: 'Invalid repository URL' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async calculateCredits(@Body() body: CalculateRepoDto) {
    return this.repositoryService.calculateCredits(body.repoUrl);
  }

  @Post()
  @ApiOperation({
    summary: 'Ingest a git repository URL and save its file tree',
  })
  @ApiResponse({
    status: 201,
    description: 'Repository and files ingested successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid repository URL or branch' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createRepo(
    @CurrentUser('id') userId: string,
    @Body() createRepoDto: CreateRepoDto,
  ) {
    return this.repositoryService.createRepo(userId, createRepoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all repositories for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'User repositories retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAllReposForUser(@CurrentUser('id') userId: string) {
    return this.repositoryService.getAllReposForUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific repository by ID' })
  @ApiResponse({
    status: 200,
    description: 'Repository retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  async getRepoById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.repositoryService.getRepoById(id, userId);
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger incremental sync for a repository' })
  @ApiResponse({
    status: 200,
    description: 'Repository sync initiated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  async syncRepo(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.repositoryService.syncRepo(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a repository and all related data' })
  @ApiResponse({ status: 200, description: 'Repository deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  async deleteRepo(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.repositoryService.deleteRepo(id, userId);
  }
}
