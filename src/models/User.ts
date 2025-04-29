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
  refreshTokens?: string[];
  failedLoginAttempts?: number;
  lastFailedLogin?: Date;
  isLocked?: boolean;
  lockUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  isAccountLocked(): boolean;
  resetFailedAttempts(): void;
  incrementFailedAttempts(): void;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String },
    profileImage: { type: String },
    refreshTokens: { type: [String], default: [] },
    failedLoginAttempts: { type: Number, default: 0 },
    lastFailedLogin: { type: Date },
    isLocked: { type: Boolean, default: false },
    lockUntil: { type: Date },
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

userSchema.methods.isAccountLocked = function () {
  if (this.isLocked && this.lockUntil) {
    return this.lockUntil > new Date();
  }
  return false;
};

userSchema.methods.resetFailedAttempts = function () {
  this.failedLoginAttempts = 0;
  this.isLocked = false;
  this.lockUntil = undefined;
};

userSchema.methods.incrementFailedAttempts = function () {
  this.failedLoginAttempts += 1;
  this.lastFailedLogin = new Date();

  if (this.failedLoginAttempts >= 5) {
    this.isLocked = true;
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
  }
};

const User = mongoose.model<IUser>("User", userSchema);

export default User;
