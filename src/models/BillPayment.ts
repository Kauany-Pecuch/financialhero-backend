import {BelongsTo, Column, DataType, ForeignKey, Index, Model, Table} from "sequelize-typescript";
import {Bill} from "./Bill.js";

@Table({
  tableName: "bill_payment",
  freezeTableName: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      name: "bill_payment_bill_year_month_uk",
      fields: ["bill_id", "year", "month"],
    },
  ],
})
export class BillPayment extends Model {

  @ForeignKey(() => Bill)
  @Column({
    type: DataType.INTEGER,
    field: "bill_id",
    allowNull: false,
  })
  billId!: number;

  @Column({
    type: DataType.INTEGER,
    field: "year",
    allowNull: false,
  })
  year!: number;

  @Column({
    type: DataType.INTEGER,
    field: "month",
    allowNull: false,
  })
  month!: number;

  @Column({
    type: DataType.BOOLEAN,
    field: "is_paid",
    defaultValue: false,
    allowNull: false,
  })
  isPaid!: boolean;

  @Column({
    type: DataType.DATE,
    field: "paid_at",
    allowNull: true,
  })
  paidAt!: Date | null;

  @BelongsTo(() => Bill, {
    onDelete: "CASCADE",
  })
  bill!: Bill;
}
