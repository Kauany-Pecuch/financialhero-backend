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

  @Column({
    type: DataType.STRING,
    field: "password_reset_token",
    allowNull: true,
  })
  passwordResetToken?: string | null;

  @Column({
    type: DataType.DATE,
    field: "password_reset_expires",
    allowNull: true,
  })
  passwordResetExpires?: Date | null;

  @HasMany(() => Bill, {
    foreignKey: "user_id",
    onDelete: "CASCADE"
  })
  bills!: Bill[];

  toJSON() {
    const values = { ...this.get() };

    delete values.bills;
    delete values.password;
    delete values.passwordResetToken;
    delete values.passwordResetExpires;

    return values;
  }
}