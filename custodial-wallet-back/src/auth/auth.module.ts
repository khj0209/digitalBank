import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../database/database.module';
import { WalletModule } from '../wallet/wallet.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule, forwardRef(() => WalletModule)], // forwardRef로 WalletModule 처리
  controllers: [AuthController],
  providers: [AuthService, JwtService],
  exports: [AuthService], // AuthService를 exports에 추가
})
export class AuthModule {}
