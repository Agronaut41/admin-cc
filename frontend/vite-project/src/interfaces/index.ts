// src/interfaces/index.ts

export interface IDriver {
  _id: string;
  username: string;
}

export interface ICacamba {
  _id: string;
  numero: string;
  tipo: 'entrega' | 'retirada';
  imageUrl: string;
  orderId: string;
  createdAt: string;
}

export interface IOrder {
  _id: string;
  clientName: string;
  contactName: string;
  contactNumber: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  type: 'entrega' | 'retirada' | 'troca';
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  motorista?: IDriver | null;
  priority: number;
  imageUrls: string[];
  cacambas: ICacamba[];
  createdAt: string;
  updatedAt: string;
}