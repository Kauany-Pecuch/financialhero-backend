import { z } from "zod"

export const TIPO_ARQUIVO = [
  "COBRANCA",
  "COMPROVANTE"
] as const;

export type TipoArquivo = (typeof TIPO_ARQUIVO)[number];

export const uploadFileSchema = z.object({
  type: z.enum(TIPO_ARQUIVO),
});

export const fileUploadQuerySchema = z.object({
  search: z.string().optional().nullable(),
  billId: z.coerce.number().int().positive().optional(),
  type: z.enum(TIPO_ARQUIVO)
});
