import { Injectable } from "@nestjs/common";
import * as bcrypt from 'bcrypt'; // 비밀번호 암호화할거면 필요
import { DatabaseService } from "src/database/database.service";

@Injectable()
export class KycService {
    constructor(private readonly db: DatabaseService) {} // DB 연결 객체 주입

    async registerKyc(userId: string, name: string, phoneNumber: string, homeAddress: string) {
        // KYC 등록 로직 구현
        const res = await this.db.query(
            'INSERT INTO kycs (user_id, name, phone_number, home_address, hash) VALUES ($1, $2, $3, $4, $5) RETURNING user_id',
            [userId, name, phoneNumber, homeAddress, bcrypt.hash(name+phoneNumber+homeAddress, 10)],
          ).then(result => result.rows[0]);
        if(!res) throw new Error('KYC registration failed');
        this.db.query(
            'UPDATE users SET is_kyc = true WHERE id = $1',
            [userId],
        );
        
        return { res };
    }
    // KYC 관련 비즈니스 로직 구현
}