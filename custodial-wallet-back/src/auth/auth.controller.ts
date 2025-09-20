// import { redirect } from 'next/dist/server/api-utils';
import { Controller, Post, Body, Session, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { WalletService } from '../wallet/wallet.service'; // WalletService 추가

@Controller('auth')
export class AuthController {
  
  constructor(
    private readonly authService: AuthService,
    private readonly walletService: WalletService, // WalletService 주입
  ) {}

  @Post('login')
  async login(
    @Body() body: { username: string; password: string; redirect_to?: string; }, 
    @Res() res: Response,
  ) {
    const userInfo = await this.authService.validateUser(body.username, body.password);
    
    if (!userInfo) {
      throw new Error('Invalid credentials');
    }

    // 🚀 로그인 성공 후 지갑도 불러와 세션에 세팅
    const wallet = await this.walletService.findWalletByUserId(userInfo.id);
    console.log('User wallet:', wallet);
    const user = {
      id: userInfo.id,
      username: userInfo.username,
      is_kyc: userInfo.is_kyc,
    };

    return res.status(200).json({
      message: 'Login successful',
      user: user,
      wallet: wallet,
      jwt: this.authService.generateJwt(userInfo.id || '', wallet?.address || '', wallet?.public_key || ''),
    });
  }

  @Post('signup')
  async signup(
    @Body() body: { username: string; password: string; passwordCheck: string; }
  ) {
    const { username, password, passwordCheck } = body;
    if (password !== passwordCheck) {
      throw new Error('Passwords do not match');
    }
    
    // 중복된 username 체크
    const existingUser = await this.authService.validateUser(username, password);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    // DB에 유저 생성
    const result = await this.authService.createUser(username, password);
    const userId = result.id;
    
    // 지갑 생성
    const wallet = await this.walletService.createWallet(userId);
    
    return {
      message: 'Signup successful',
      user: {
        id: userId,
        username: username,
      },
      wallet: wallet,
    };
  }
}
