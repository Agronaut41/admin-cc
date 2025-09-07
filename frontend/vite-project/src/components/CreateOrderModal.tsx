import React, { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import type { IDriver, IOrder } from '../interfaces';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 90%;
  width: 600px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #555;
`;

const FormGrid = styled.form`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;

  label {
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
    color: #555;
  }

  input, select {
    padding: 0.6rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
`;

const Button = styled.button`
  background-color: #3b82f6;
  color: white;
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  grid-column: 1 / -1;
  
  &:hover {
    background-color: #2563eb;
  }
`;

interface CreateOrderModalProps {
  onClose: () => void;
  onOrderCreated: () => void;
  drivers: IDriver[];
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ onClose, onOrderCreated, drivers }) => {
  const [newOrder, setNewOrder] = useState<Partial<IOrder>>({
    clientName: '', contactName: '', contactNumber: '',
    neighborhood: '', address: '', addressNumber: '',
    type: 'entrega', status: 'pendente', priority: 0,
    motorista: null
  });

  const authenticatedFetch = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    };
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      alert('Acesso negado ou sessão inválida. Faça login novamente.');
      localStorage.removeItem('token');
      window.location.href = '/';
      throw new Error('Authentication failed');
    }
    return response;
  };

  const handleCreateOrder = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await authenticatedFetch('http://localhost:3001/orders', {
        method: 'POST',
        body: JSON.stringify({
            ...newOrder,
            motorista: newOrder.motorista?._id || null // Envia apenas o ID
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Pedido criado com sucesso!');
        onOrderCreated();
        onClose();
      } else {
        alert(data.message || 'Erro ao criar pedido.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao criar pedido.');
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2>Adicionar Novo Pedido</h2>
        <FormGrid onSubmit={handleCreateOrder}>
          <FormGroup>
            <label>Nome do Cliente</label>
            <input
              type="text"
              value={newOrder.clientName || ''}
              onChange={(e) => setNewOrder({ ...newOrder, clientName: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <label>Nome do Contato</label>
            <input
              type="text"
              value={newOrder.contactName || ''}
              onChange={(e) => setNewOrder({ ...newOrder, contactName: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <label>Número de Contato</label>
            <input
              type="text"
              value={newOrder.contactNumber || ''}
              onChange={(e) => setNewOrder({ ...newOrder, contactNumber: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <label>Bairro</label>
            <input
              type="text"
              value={newOrder.neighborhood || ''}
              onChange={(e) => setNewOrder({ ...newOrder, neighborhood: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <label>Endereço</label>
            <input
              type="text"
              value={newOrder.address || ''}
              onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <label>Número</label>
            <input
              type="text"
              value={newOrder.addressNumber || ''}
              onChange={(e) => setNewOrder({ ...newOrder, addressNumber: e.target.value })}
              required
            />
          </FormGroup>
          <FormGroup>
            <label>Tipo</label>
            <select
              value={newOrder.type || 'entrega'}
              onChange={(e) => setNewOrder({ ...newOrder, type: e.target.value as IOrder['type'] })}
              required
            >
              <option value="entrega">Entrega</option>
              <option value="retirada">Retirada</option>
              <option value="troca">Troca</option>
            </select>
          </FormGroup>
          <FormGroup>
            <label>Delegar ao Motorista</label>
            <select
              value={newOrder.motorista?._id || ''}
              onChange={(e) => setNewOrder({ ...newOrder, motorista: { _id: e.target.value, username: '' } as IDriver })}
            >
              <option value="">Não atribuído</option>
              {drivers.map(driver => (
                <option key={driver._id} value={driver._id}>{driver.username}</option>
              ))}
            </select>
          </FormGroup>
          <Button type="submit">Criar Pedido</Button>
        </FormGrid>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateOrderModal;