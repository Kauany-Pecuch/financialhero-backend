import {Model} from "sequelize-typescript";
import {Column, DataType, Table} from "sequelize-typescript";

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
    type: DataType.DOUBLE
  })
  wage!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  email!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  password!: string;
}