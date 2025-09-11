// src/models/Client.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  clientName: string;
  contactName: string;
  contactNumber: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
}

const ClientSchema: Schema = new Schema({
  clientName: { type: String, required: true }, // Alterado de 'name' para 'clientName'
  contactName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  neighborhood: { type: String, required: true },
  address: { type: String, required: true },
  addressNumber: { type: String, required: true },
}, {
  timestamps: true
});

export const ClientModel = mongoose.model<IClient>('Client', ClientSchema);
