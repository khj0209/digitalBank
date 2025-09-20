import { Controller } from "@nestjs/common";
import { KycService } from "./kyc.service";
import { Post, Body } from "@nestjs/common";

@Controller('kyc')
export class KycController {
    constructor(
        private readonly kycService: KycService
    ) {}


    @Post('register')
    async registerKyc(
        @Body() body: { userId: string; name: string; phoneNumber: string; homeAddress: string; }
    ) {
        const { userId, name, phoneNumber, homeAddress } = body;
        // KYC 등록 로직 구현
        return this.kycService.registerKyc(userId, name, phoneNumber, homeAddress);
    }
}