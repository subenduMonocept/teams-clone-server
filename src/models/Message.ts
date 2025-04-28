import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessageBase {
  sender: Types.ObjectId;
  receiver?: Types.ObjectId;
  group?: Types.ObjectId;
  content: string;
  type: "text" | "file" | "call";
  fileUrl?: string;
  createdAt: Date;
}

export interface IMessage extends IMessageBase, Document {}

const MessageSchema: Schema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: Schema.Types.ObjectId, ref: "User" },
  group: { type: Schema.Types.ObjectId, ref: "Group" },
  content: { type: String, required: true },
  type: { type: String, enum: ["text", "file", "call"], default: "text" },
  fileUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IMessage>("Message", MessageSchema);
