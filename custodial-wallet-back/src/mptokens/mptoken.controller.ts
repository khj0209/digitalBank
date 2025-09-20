import { Controller, Post, Get, Session, Headers, Body, Req } from '@nestjs/common';
import { MptokenService } from './mptoken.service';
import { AuthService } from 'src/auth/auth.service';
import { SendBatchMptDto } from './dto/send-mpt.dto';
import { AuthorizeMptDto } from './dto/authorize-mpt.dto';

@Controller('mptoken')
export class MptokenController {
  constructor(
    private readonly mptokenService: MptokenService,
    private readonly authService : AuthService
  ) {}

  @Post('get')
  async getMptokens(
    // @Body('userSeed') userSeed: string
    @Body('userId') userId: string
  ) {
 
    // return this.mptokenService.getBalance(userSeed);
    return this.mptokenService.getBalanceOfMpts(userId)
  }

  /**
   * MPT 발행
   * POST /mptokens
   * body: { userId, name, ticker }
   */
  @Post()
  async createMptoken(
    @Body('userId') userId: string,
    @Body('name') name: string,
    @Body('ticker') ticker: string,
  ) {
    if (!userId || !name || !ticker) {
      return { error: 'userId, name, ticker 모두 필요' };
    }

    try {
      const result = await this.mptokenService.createMptokens(
        userId,
        name,
        ticker,
      );
      return {
        success: true,
        message: 'MPT 생성 완료',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'MPT 생성 실패',
        error: error.message,
      };
    }
  }
  @Post('send-batch')
  async sendBatch(
    @Body() dto: SendBatchMptDto, @Req() req: any) {
  // 
    const result = await this.mptokenService.sendBatchMpt(dto)
    return { success: true, result }
  }

  @Post('authorize')
  async authorizeMpt(
    @Body('userId') userId: string,
    @Body('issuanceId') issuanceId: string
  ) {
    if (!issuanceId || !userId) throw new Error('IssuanceID와 userId 필요')

    const result = await this.mptokenService.authorizeMptoken(issuanceId, userId)
    return { success: true, result }
  }
}
