import mongoose, { Document, Schema } from 'mongoose';

// Interface do documento do usuário
export interface IUser extends Document {
  username: string;
  password?: string;
  role: 'admin' | 'motorista'; // Adicionamos o campo role com tipos específicos
}

// Criação do Schema
const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'motorista'], // Define os valores permitidos para o campo
    default: 'motorista', // Todo novo usuário será um motorista por padrão
    required: true
  }
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);