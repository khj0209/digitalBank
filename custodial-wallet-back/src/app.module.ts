import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { WalletModule } from './wallet/wallet.module';
import { KycModule } from './kyc/kyc.module';
import { MptokenModule } from './mptokens/mptoken.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // .env 읽게 설정
    DatabaseModule,AuthModule, WalletModule, KycModule, MptokenModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
