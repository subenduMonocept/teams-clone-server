import mongoose, { Document, Schema, Types } from "mongoose";

export interface IGroupBase {
  name: string;
  description?: string;
  createdBy: Types.ObjectId;
  members: Types.ObjectId[];
  admins: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroup extends IGroupBase, Document {}

const GroupSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User" }],
  admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

GroupSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IGroup>("Group", GroupSchema);
