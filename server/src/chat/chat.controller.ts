import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat conversation for a repository' })
  @ApiResponse({
    status: 201,
    description: 'Chat session created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  async createChat(
    @CurrentUser('id') userId: string,
    @Body() createChatDto: CreateChatDto,
  ) {
    return this.chatService.createChat(userId, createChatDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific chat session with its full message history',
  })
  @ApiParam({ name: 'id', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Chat session and messages retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden access to chat' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async getChatById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.chatService.getChatById(userId, id);
  }

  @Get(':chatId/messages')
  @ApiOperation({ summary: 'Get all messages for a specific chat session' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'List of messages retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden access to chat' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async getChatMessages(
    @CurrentUser('id') userId: string,
    @Param('chatId') chatId: string,
  ) {
    return this.chatService.getChatMessages(userId, chatId);
  }

  @Post(':chatId/messages')
  @ApiOperation({ summary: 'Send a message to a specific chat session' })
  @ApiParam({ name: 'chatId', description: 'Chat ID' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden access to chat' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('chatId') chatId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(userId, chatId, sendMessageDto);
  }
}

