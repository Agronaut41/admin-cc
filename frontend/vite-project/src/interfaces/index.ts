// src/interfaces/index.ts

export interface IClient {
  _id: string;
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

export type OrderType = 'entrega' | 'retirada' | 'troca';

export interface IOrder {
  _id: string;
  orderNumber: number | null;
  clientId?: string;
  clientName: string;
  cnpjCpf?: string;
  city?: string;
  cep?: string; // ADICIONADO
  contactName: string;
  contactNumber: string;
  neighborhood: string;
  address: string;
  addressNumber: string;
  type: OrderType;
  priority: number;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
  motorista?: any;
  imageUrls?: string[];
  cacambas?: ICacamba[];
  createdAt?: string;
}