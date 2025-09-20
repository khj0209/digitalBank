import { Controller, Post, Get, Session, Headers, Body } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { WalletService } from './wallet.service';
import { Transaction, Wallet } from 'xrpl';
import * as bcrypt from 'bcrypt';

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly authService: AuthService,
    private readonly walletService: WalletService,
  ) {}

  @Post('create')
  async createWallet(
    @Headers('Authorization') jwt: string,
  ) {
    // jwt 검증
    const claims = this.authService.verifyJwt(jwt);
    if (!claims || !claims.userId) {
      throw new Error('Invalid JWT token');
    }
    const userId = claims.userId;

    return this.walletService.createWallet(userId);
  }

  @Post('sign')
  async signTransaction(
    @Headers('Authorization') jwt: string,
    @Body() tx: Transaction,
  ) {
    // jwt 검증
    const claims = this.authService.verifyJwt(jwt);
    if (!claims || !claims.userId) {
      throw new Error('Invalid JWT token');
    }
    const userId = claims.userId;

    return this.walletService.signTransaction(userId, tx);
  }

  @Post('sendTx')
  async sendTransaction(
    @Headers('Authorization') jwt: string,
    @Body() tx: Transaction,
  ) {

    // jwt 검증
    const claims = this.authService.verifyJwt(jwt);
    if (!claims || !claims.userId) {
      throw new Error('Invalid JWT token');
    }
    const userId = claims.userId;

    const signedTx = await this.walletService.signTransaction(userId, tx);
    const result = await this.walletService.sendTransaction(signedTx.tx_blob);

    return result;

  }

  @Get('me')
  getWallet(@Session() session: Record<string, any>) {
    if (!session.wallet) {
      throw new Error('No wallet found');
    }
    return { address: session.wallet.address };
  }
}
