import type {
  CreateUserRequest,
  LoginRequest
} from "../schemas/user/user.js";
import {User} from "../models/User.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const { SALT_ROUNDS, JWT_SECRET } = process.env;

export default class UserService {

  async createUser(
    creationRequest: CreateUserRequest
  ): Promise<{ token: string }> {
    const { password, email, lastName, firstName, wage } = creationRequest;

    const existingUser = await this.findUserByEmail(email);

    if (existingUser) {
      throw new Error("Usuário já resgistrado no sistema");
    }

    const hashedPass = await bcrypt.hash(password, Number(SALT_ROUNDS));

    const user = await User.create({
      password: hashedPass,
      email: email,
      firstName: firstName,
      lastName: lastName,
      wage: wage ?? 0
    });

    const token = this.createToken(user)

    return {token};
  }

  async login(
    loginRequest: LoginRequest
  ): Promise<{ token: string }> {
    const { password = '', email = '' } = loginRequest;

    const user = await this.findUserByEmail(email);
    if (!user) throw new Error("Email ou senha incorretos");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Email ou senha incorretos");

    const token = this.createToken(user);

    return {token};
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    if (!email) return null;

    return User.findOne({
      where: { email }
    })
  }

  private createToken(user: User): string {
    return jwt.sign({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      wage: user.wage
    },
    JWT_SECRET as string,
    { expiresIn: '1d' }
    )
  }
}