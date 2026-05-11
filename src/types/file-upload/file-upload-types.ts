import { z } from "zod"

export const TIPO_ARQUIVO = [
  "COBRANCA",
  "COMPROVANTE"
] as const;

export type TipoArquivo = (typeof TIPO_ARQUIVO)[number];

export const uploadFileSchema = z.object({
  type: z.enum(TIPO_ARQUIVO),
});
