// src/mpt/dto/send-mpt.dto.ts
export class SendMptDto {
    toSeed: string;          // 수신자 시드
    amount: string;      // 전송 금액
  }
  
  export class SendBatchMptDto {
    reqUserSeed : string;
    transfers: SendMptDto[];
    issuanceId: string;  // 전송할 MPT IssuanceID
  }
  