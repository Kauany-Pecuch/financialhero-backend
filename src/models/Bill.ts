import {BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table} from "sequelize-typescript";
import {BillType} from "../schemas/bill/enums.js";
import {User} from "./User.js";
import {FileUpload} from "./FileUpload.js";

@Table({
  tableName: "bill",
  freezeTableName: true,
  underscored: true,
})
export class Bill extends Model {

  @Column({
    type: DataType.STRING(...Object.values(BillType)),
    field: "type",
    allowNull: false,
  })
  type!: BillType;

  @Column({
    type: DataType.STRING,
    field: "description"
  })
  description!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    field: "amount",
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.STRING,
    field: "name",
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.DATE,
    field: "expiration_date",
    allowNull: false,
  })
  expirationDate!: Date;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    field: "user_id",
  })
  userId!: number;

  @BelongsTo(() => User, {
    onDelete: "CASCADE"
  })
  user!: User;

  @HasMany(() => FileUpload, {
    foreignKey: "bill_id",
    onDelete: "CASCADE"
  })
  fileUploads!: FileUpload[];
}