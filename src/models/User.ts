import mongoose, { Document, Schema, UpdateQuery } from "mongoose";
import bcrypt from "bcrypt";
import { toIST } from "../services/timeConverter";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  gender?: string;
  profileImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String },
    profileImage: { type: String },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next: any) {
  const user = this as IUser;

  if (user.isModified("password")) {
    try {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      user.password = hashedPassword;
      next();
    } catch (err) {
      next(err as any);
    }
  } else {
    next();
  }
});

userSchema.pre("findOneAndUpdate", async function (next: any) {
  const update = this.getUpdate() as UpdateQuery<IUser>;

  if (update && update.password) {
    try {
      const hashedPassword = await bcrypt.hash(update.password, 10);
      update.password = hashedPassword;
      next();
    } catch (err) {
      next(err as any);
    }
  } else {
    next();
  }
});

userSchema.pre("save", function (next) {
  this.set("createdAt", toIST(new Date()));
  this.set("updatedAt", toIST(new Date()));
  next();
});

userSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: toIST(new Date()) });
  next();
});

const User = mongoose.model<IUser>("User", userSchema);

export default User;
