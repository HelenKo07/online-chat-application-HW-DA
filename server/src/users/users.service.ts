import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  findByEmail(email: string) {
    return this.database.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  findByUsername(username: string) {
    return this.database.user.findUnique({
      where: { username: username.toLowerCase() },
    });
  }

  findById(id: string) {
    return this.database.user.findUnique({
      where: { id },
    });
  }

  createUser(input: { email: string; username: string; passwordHash: string }) {
    return this.database.user.create({
      data: {
        email: input.email.toLowerCase(),
        username: input.username.toLowerCase(),
        passwordHash: input.passwordHash,
      },
    });
  }
}
