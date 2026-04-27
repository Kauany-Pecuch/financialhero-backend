import type {
  CreateUserRequest,
  LoginRequest,
  UpdateUserRequest
} from "../schemas/user/user.js";
import {User} from "../models/User.js";
import { AppError } from "../errors/AppError.js";
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
      throw new AppError("Usuário já registrado no sistema", 400, "USER_ALREADY_EXISTS");
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
    if (!user) throw new AppError("Email ou senha incorretos", 401, "INVALID_CREDENTIALS");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new AppError("Email ou senha incorretos", 401, "INVALID_CREDENTIALS");

    const token = this.createToken(user);

    return {token};
  }

  private async findUserByEmail(email: string): Promise<User | null> {
    if (!email) return null;

    return User.findOne({
      where: { email }
    })
  }

  async updateUser(
    userId: number,
    updateRequest: UpdateUserRequest
  ): Promise<User> {
    const { firstName, lastName, email, wage } = updateRequest;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError("Usuário não encontrado", 404);
    }

    if (firstName !== undefined && firstName.trim() === "") {
      throw new AppError("FirstName não pode estar vazio", 400);
    }

    if (lastName !== undefined && lastName.trim() === "") {
      throw new AppError("LastName não pode estar vazio", 400);
    }

    if (email !== undefined && email.trim() === "") {
      throw new AppError("Email não pode estar vazio", 400);
    }

    if (wage !== undefined && wage < 0) {
      throw new AppError("Wage não pode ser negativo", 400);
    }

    if (email && email !== user.email) {
      const existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        throw new AppError("Email já está em uso por outro usuário", 400);
      }
    }

    const dataToUpdate: Partial<User> = {};

    if (firstName !== undefined) dataToUpdate.firstName = firstName;
    if (lastName !== undefined) dataToUpdate.lastName = lastName;
    if (email !== undefined) dataToUpdate.email = email;
    if (wage !== undefined) dataToUpdate.wage = wage;

    await user.update(dataToUpdate);

    return user;
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