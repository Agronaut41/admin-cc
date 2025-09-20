// src/models/Client.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  clientName: string;
  contactName: string;
  contactNumber: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  cnpjCpf?: string;
  city?: string;
  cep?: string; // ADICIONADO
}

const ClientSchema: Schema = new Schema<IClient>({
  clientName: { type: String, required: true, trim: true },
  contactName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  neighborhood: { type: String, required: true },
  address: { type: String, required: true },
  addressNumber: { type: String, required: true },
  cnpjCpf: { type: String, trim: true, default: '' },
  city: { type: String, trim: true, default: '' },
  cep: { type: String, trim: true, default: '' }, // ADICIONADO
}, {
  timestamps: true
});

export const ClientModel = mongoose.model<IClient>('Client', ClientSchema);
