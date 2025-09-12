import React, { useState, useEffect, type FormEvent } from 'react';
import styled from 'styled-components';
import type { IDriver, IClient } from '../interfaces';

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center; z-index: 100;
`;
const ModalContent = styled.div`
  background-color: white; border-radius: 8px; padding: 1.5rem 2rem;
  width: 100%; max-width: 500px; margin: 0 1rem;
`;
const Title = styled.h2`
  font-size: 1.5rem; font-weight: 600; margin: 0 0 1.5rem 0; color: #111827;
`;
const Form = styled.form`
  display: flex; flex-direction: column; gap: 1rem;
`;
const FormGroup = styled.div`
  display: flex; flex-direction: column;
`;
const Label = styled.label`
  font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;
`;
const Input = styled.input`
  width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #d1d5db;
  border-radius: 6px; font-size: 1rem;
  &:read-only { background-color: #f3f4f6; color: #6b7280; }
`;
const Select = styled.select`
  width: 100%; padding: 0.6rem 0.75rem; border: 1px solid #d1d5db;
  border-radius: 6px; font-size: 1rem; background-color: white;
`;
const ButtonGroup = styled.div`
  display: flex; gap: 0.75rem; margin-top: 1.5rem;
`;
const SubmitButton = styled.button`
  flex: 1; background-color: #2563eb; color: white; padding: 0.6rem 1rem;
  border: none; border-radius: 6px; font-size: 1rem; cursor: pointer;
  &:hover { background-color: #1d4ed8; }
`;
const CancelButton = styled.button`
  flex: 1; background-color: #e5e7eb; color: #374151; padding: 0.6rem 1rem;
  border: none; border-radius: 6px; font-size: 1rem; cursor: pointer;
  &:hover { background-color: #d1d5db; }
`;
const ErrorMessage = styled.p`
  color: #ef4444; font-size: 0.875rem; margin: 0;
`;


interface CreateOrderModalProps {
  onClose: () => void;
  onOrderCreated: () => void;
  drivers: IDriver[];
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ onClose, onOrderCreated, drivers }) => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [formData, setFormData] = useState({
    clientName: '',
    contactName: '',
    contactNumber: '',
    neighborhood: '',
    address: '',
    addressNumber: '',
    type: 'entrega',
    motorista: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/clients', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    };
    fetchClients();
  }, []);

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);

    if (clientId) {
      const selectedClient = clients.find(c => c._id === clientId);
      if (selectedClient) {
        setFormData(prev => ({
          ...prev,
          clientName: selectedClient.clientName,
          contactName: selectedClient.contactName,
          contactNumber: selectedClient.contactNumber,
          neighborhood: selectedClient.neighborhood,
          address: selectedClient.address,
          addressNumber: selectedClient.addressNumber,
        }));
      }
    } else {
      // Limpa o formulário se nenhum cliente for selecionado
      setFormData({
        clientName: '', contactName: '', contactNumber: '', neighborhood: '',
        address: '', addressNumber: '', type: 'entrega', motorista: '',
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedClientId) {
      setError('Por favor, selecione um cliente.');
      return;
    }

    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3001/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ ...formData, clientId: selectedClientId }),
    });

    if (response.ok) {
      onOrderCreated();
      onClose();
    } else {
      const errorData = await response.json();
      setError(errorData.message || 'Erro ao criar pedido.');
    }
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>Criar Novo Pedido</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Selecione o Cliente</Label>
            <Select value={selectedClientId} onChange={handleClientChange} required>
              <option value="">-- Escolha um cliente --</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>{client.clientName}</option>
              ))}
            </Select>
          </FormGroup>

          {selectedClientId && (
            <>
              <FormGroup>
                <Label>Nome do Contato</Label>
                <Input type="text" value={formData.contactName}/>
              </FormGroup>
              <FormGroup>
                <Label>Número do Contato</Label>
                <Input type="text" value={formData.contactNumber}/>
              </FormGroup>
              <FormGroup>
                <Label>Bairro</Label>
                <Input type="text" value={formData.neighborhood}/>
              </FormGroup>
              <FormGroup>
              <FormGroup>
                <Label>Endereço</Label>
                <Input type="text" value={formData.address} />
              </FormGroup>
                <Label>Número</Label>
                <Input type="text" value={formData.addressNumber}/>
              </FormGroup>
              <FormGroup>
                <Label>Tipo de Pedido</Label>
                <Select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as 'entrega' | 'retirada' | 'troca' }))}
                >
                  <option value="entrega">Entrega</option>
                  <option value="retirada">Retirada</option>
                  <option value="troca">Troca</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Atribuir Motorista (Opcional)</Label>
                <Select
                  value={formData.motorista}
                  onChange={e => setFormData(prev => ({ ...prev, motorista: e.target.value }))}
                >
                  <option value="">Nenhum</option>
                  {drivers.map(driver => (
                    <option key={driver._id} value={driver._id}>{driver.username}</option>
                  ))}
                </Select>
              </FormGroup>
            </>
          )}

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <ButtonGroup>
            <SubmitButton type="submit">Criar Pedido</SubmitButton>
            <CancelButton type="button" onClick={onClose}>Cancelar</CancelButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateOrderModal;