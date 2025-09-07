// src/models/Cacamba.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface ICacamba extends Document {
  numero: string;
  tipo: 'entrega' | 'retirada';
  imageUrl: string;
  orderId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const CacambaSchema: Schema = new Schema({
  numero: { type: String, required: true },
  tipo: { type: String, enum: ['entrega', 'retirada'], required: true },
  imageUrl: { type: String, required: true },
  orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  createdAt: { type: Date, default: Date.now },
});

export const CacambaModel = mongoose.model<ICacamba>('Cacamba', CacambaSchema);
