import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { WalletService } from 'src/wallet/wallet.service';
import { WalletModule } from 'src/wallet/wallet.module';

@Module({
  imports: [DatabaseModule, WalletModule], // forwardRef로 WalletModule 처리
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService], // AuthService를 exports에 추가
})
export class KycModule {}
