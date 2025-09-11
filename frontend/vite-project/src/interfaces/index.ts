// src/interfaces/index.ts

export interface IClient {
  _id: string;
  name: string;
  contactName: string;
  contactNumber: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
}

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
  local: 'via_publica' | 'canteiro_obra'; // <-- Adicione aqui
  createdAt: string;
}

export interface IOrder {
  _id: string;
  orderNumber: number;
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