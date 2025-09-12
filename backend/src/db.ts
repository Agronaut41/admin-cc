import mongoose from 'mongoose';
import { UserModel } from './models/User';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || '');
    console.log(`MongoDB Conectado: ${conn.connection.host}`);

    const adminUser = await UserModel.findOne({ username: 'admin' });

    if (!adminUser) {
      const newAdmin = new UserModel({
        username: 'admin',
        password: '123',
        role: 'admin' // Add this line to set the role
      });
      await newAdmin.save();
      console.log('Usuário "admin" criado com sucesso.');
    }
  } catch (error) {
    // Error handling code is correct
    if (error instanceof Error) {
      console.error(`Erro ao conectar ao MongoDB: ${error.message}`);
    } else {
      console.error(`Erro ao conectar ao MongoDB: ${error}`);
    }
    process.exit(1);
  }
};

export default connectDB;