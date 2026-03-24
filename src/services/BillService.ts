import type {CreateBillRequest} from "../schemas/bill/schema.js";
import {Bill} from "../models/Bill.js";
import {User} from "../models/User.js";

export default class BillService {

  async createBill(
    creationRequest: CreateBillRequest,
    userId: number | string | string[]
  ): Promise<Bill> {
    const user = await User.findOne({
      where: {
        id: userId
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const { billType, expirationDate, name, amount, description } = creationRequest;

    return await Bill.create({
      billType: billType,
      description: description,
      amount: amount,
      name: name,
      expirationDate: expirationDate,
      user: user
    });
  }
}