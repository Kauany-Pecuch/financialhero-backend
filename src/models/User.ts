import {HasMany, Model} from "sequelize-typescript";
import {Column, DataType, Table} from "sequelize-typescript";
import {Bill} from "./Bill.js";

@Table({
  tableName: "users",
  freezeTableName: true,
  underscored: true,
})
export class User extends Model {

  @Column({
    type: DataType.STRING,
    field: "first_name",
  })
  firstName!: string;

  @Column({
    type: DataType.STRING,
    field: "last_name",
  })
  lastName!: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    field: "wage",
  })
  wage!: number;

  @Column({
    type: DataType.STRING,
    field: "email",
    allowNull: false,
    unique: true,
  })
  email!: string;

  @Column({
    type: DataType.TEXT,
    field: "password",
    allowNull: false,
  })
  password!: string;

  @HasMany(() => Bill, {
    foreignKey: "user_id",
    onDelete: "CASCADE"
  })
  bills!: Bill[];

  toJSON() {
    const values = { ...this.get() };

    delete values.bills;
    delete values.password;

    return values;
  }
}