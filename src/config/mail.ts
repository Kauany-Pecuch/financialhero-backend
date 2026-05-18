export const mailConfig = {
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  defaults: {
    from: `"Financial Hero" <${process.env.MAIL_USER}>`,
  },
} as const;
