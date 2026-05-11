import crypto from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { MailProvider } from '../shared/providers/MailProvider.js';
import { AppError } from '../errors/AppError.js';

dotenv.config();

const { FRONTEND_URL } = process.env;

export class PasswordService {
  private mailProvider = new MailProvider();

  async sendForgotPasswordEmail(email: string): Promise<void> {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new AppError("Usuário não encontrado", 404);

    const token = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    await user.update({
      passwordResetToken: tokenHash,
      passwordResetExpires: expires,
    });

    const link = `${FRONTEND_URL}/reset-password?token=${token}`;
    await this.mailProvider.sendMail(
      email,
      "Recuperação de Senha - Financial Hero",
      `<p>Você solicitou a alteração de senha. Use o link: <a href="${link}">${link}</a></p>`
    );
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ where: { passwordResetToken: tokenHash } });

    if (!user || (user.passwordResetExpires && new Date() > user.passwordResetExpires)) {
      throw new AppError("Token inválido ou expirado", 400);
    }

    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      throw new AppError("A nova senha não pode ser igual à senha anterior", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }
}
