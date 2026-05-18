import crypto from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { User } from '../models/User.js';
import { MailProvider } from '../shared/providers/MailProvider.js';
import { AppError } from '../errors/AppError.js';

dotenv.config();

const { FRONTEND_URL, SALT_ROUNDS } = process.env;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resetPasswordTemplatePath = path.resolve(__dirname, '../../templates/reset-password.html');

export interface TokenEntry {
  userId: number;
  expiresAt: Date;
}

export const tokenStore = new Map<string, TokenEntry>();

export class PasswordService {
  private mailProvider = new MailProvider();

  async sendForgotPasswordEmail(email: string): Promise<void> {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new AppError("Usuário não encontrado", 404);

    const token = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    tokenStore.set(tokenHash, { userId: user.id, expiresAt });

    const link = `${FRONTEND_URL}/reset-password?token=${token}`;
    const htmlTemplate = await readFile(resetPasswordTemplatePath, 'utf-8');
    const html = htmlTemplate.replace(/\{\{link\}\}/g, link);

    await this.mailProvider.sendMail(
      email,
      "Recuperação de Senha - Financial Hero",
      html
    );
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const entry = tokenStore.get(tokenHash);

    if (!entry || new Date() > entry.expiresAt) {
      throw new AppError("Token inválido ou expirado", 400);
    }

    const user = await User.findByPk(entry.userId);
    if (!user) throw new AppError("Usuário não encontrado", 404);

    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      throw new AppError("A nova senha não pode ser igual à senha anterior", 400);
    }

    const hashedPassword = await bcrypt.hash(password, Number(SALT_ROUNDS));
    await user.update({ password: hashedPassword });

    tokenStore.delete(tokenHash);
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!newPassword || newPassword.length < 8) {
      throw new AppError("A nova senha deve ter pelo menos 8 caracteres", 400);
    }

    const user = await User.findByPk(userId);
    if (!user) throw new AppError("Usuário não encontrado", 404);

    const isCurrentValid = await bcrypt.compare(currentPassword ?? "", user.password);
    if (!isCurrentValid) {
      throw new AppError("Senha atual incorreta", 400);
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError("A nova senha não pode ser igual à senha atual", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, Number(SALT_ROUNDS));
    await user.update({ password: hashedPassword });
  }
}
