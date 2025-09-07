// src/models/Order.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  clientName: string;
  contactName: string;
  contactNumber: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  type: 'entrega' | 'retirada' | 'troca';
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  motorista?: mongoose.Types.ObjectId;
  priority: number;
  imageUrls: string[]; // Adicione esta linha para armazenar as URLs das imagens
  cacambas: mongoose.Types.ObjectId[]; // Array de IDs das caçambas
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  clientName: { type: String, required: true },
  contactName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  neighborhood: { type: String, required: true },
  address: { type: String, required: true },
  addressNumber: { type: String, required: true },
  type: { type: String, enum: ['entrega', 'retirada', 'troca'], required: true },
  status: { type: String, enum: ['pendente', 'em_andamento', 'concluido', 'cancelado'], default: 'pendente' },
  motorista: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  priority: { type: Number, default: 0 },
  imageUrls: [{ type: String }], // Adicione esta linha ao schema
  cacambas: [{ type: Schema.Types.ObjectId, ref: 'Cacamba' }], // Array de IDs das caçambas
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const OrderModel = mongoose.model<IOrder>('Order', OrderSchema);