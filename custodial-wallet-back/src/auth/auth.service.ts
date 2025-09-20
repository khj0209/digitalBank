import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt'; // 비밀번호 암호화할거면 필요
import { JwtService } from '@nestjs/jwt'; // JWT 생성할거면 필요

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  createUser(username: string, password: string) {
    // 비밀번호 해싱
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds).then((hashedPassword) => {
      // DB에 유저 생성
      return this.db.query(
        'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
        [username, hashedPassword],
      ).then(result => result.rows[0]);
    }
    );
  }

  
  generateJwt(userId: string, address: string, pubkey: string) {
    // JWT 생성 로직
    const payload = { userId, address, pubkey }; // JWT payload에 담을 정보
    const secret = 'your_jwt_secret'; // 비밀 키
    const options = { expiresIn: '1h' }; // 만료 시간 설정
    const token = this.jwtService.sign(payload, { secret, ...options });

    return token; // 예시로 address를 반환
    
  }

  verifyJwt(token: string) {
    try {
      const decoded = this.jwtService.verify(token, { secret: 'your_jwt_secret' });
      return decoded; // JWT가 유효하면 디코딩된 정보 반환
    } catch (error) {
      console.error('JWT verification failed:', error);
      return null; // JWT가 유효하지 않으면 null 반환
    }
  }

  async validateUser(username: string, password: string) {
    const result = await this.db.query(
      'SELECT id, username, password, is_kyc FROM users WHERE username = $1 LIMIT 1',
      [username],
    );
    const user = result.rows[0];
    if (!user) {
      return null;
    }

    // 비밀번호 검증
    const isMatch = await bcrypt.compare(password, user.password); // 비밀번호 검증
    if (!isMatch) {
      return null;
    }

    // 비밀번호 맞으면 유저 정보 반환
    return {
      id: user.id,
      username: user.username,
      is_kyc: user.is_kyc,
    };
  }
}
