import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from "sequelize-typescript";
import {Bill} from "./Bill.js";

@Table({
  tableName: "file_upload",
  freezeTableName: true,
  underscored: true
})
export class FileUpload extends Model {

  @Column({
    type: DataType.STRING,
    field: "name",
    allowNull: false
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    field: "hash"
  })
  hash!: string;

  @Column({
    type: DataType.STRING,
    field: "path"
  })
  path!: string;

  @ForeignKey(() => Bill)
  @Column({
    type: DataType.INTEGER,
    field: "bill_id",
  })
  billId!: number;

  @BelongsTo(() => Bill, {
    onDelete: "CASCADE"
  })
  bill!: Bill;

  toJSON() {
    const values = { ...this.get() };

    delete values.bill;
    delete values.billId;

    return values;
  }
}