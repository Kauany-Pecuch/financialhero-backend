import { z } from "zod";
import type {Request} from "express";

export type TypedRequest<
  P = {},
  B = {}
> = Request<P, any, B>;

export const paramsSchema = z.object({
  userId: z.string().min(1)
});

//TODO mover pra um bill-types.ts
export const billParamsSchema = z.object({
  userId: z.string().min(1),
  billId: z.string().min(1)
});

export const paginationSchema = z.object({
  page: z.string().default("0"),
  size: z.string().default("10"),
  sort: z.string().nullish()
});

export const sortSchema = z.object({
  property: z.string().optional(),
  direction: z.string().optional()
});

export const createPagedResponseSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    content: z.array(schema),
    totalItems: z.number().default(0),
    itemCount: z.number().default(0),
    sort: z.array(sortSchema)
  });

export type Params = z.infer<typeof paramsSchema>;
export type BillParams = z.infer<typeof billParamsSchema>; //TODO mover pra bill-types.ts
export type PagedRequest = z.infer<typeof paginationSchema>;

export type PagedResponse<T> = {
  content: T[];
  totalItems: number;
  itemCount: number;
  sort: {
    property?: string;
    direction?: string;
  }[];
};