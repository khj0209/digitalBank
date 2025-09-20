import { Module, forwardRef } from '@nestjs/common';
import { MptokenController } from './mptoken.controller';
import { MptokenService } from './mptoken.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => AuthModule)], // forwardRef로 AuthModule 처리
  controllers: [MptokenController],
  providers: [MptokenService],
  exports: [MptokenService],
})
export class MptokenModule {}
