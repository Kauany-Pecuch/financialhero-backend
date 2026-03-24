import type {BillType} from "./enums.js";

export interface CreateBillRequest {
  billType: BillType;
  description?: string;
  amount: number;
  name: string;
  expirationDate: Date;
}