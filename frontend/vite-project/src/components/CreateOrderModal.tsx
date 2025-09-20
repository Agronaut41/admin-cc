import React, { useState, useEffect, type FormEvent } from 'react';
import styled from 'styled-components';
import type { IDriver, IClient } from '../interfaces';

// Overlay ocupa a tela inteira com padding e safe areas
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
           max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
  z-index: 1000;

  @media (max-width: 768px) {
    align-items: stretch; /* ocupa altura total no mobile */
  }
`;

// Conteúdo com limite de altura e scroll interno
const ModalContent = styled.div`
  background: #fff;
  border-radius: 12px;
  width: min(720px, 92vw);
  max-height: min(88dvh, 840px);
  display: flex;
  flex-direction: column;
  overflow: hidden; /* cabeçalho fixo, corpo rolável */

  @media (max-width: 768px) {
    width: 100vw;
    height: 100dvh;        /* usa toda a altura útil */
    max-height: 100dvh;
    border-radius: 0;      /* full-screen modal no mobile */
  }
`;

// Cabeçalho do modal (se já tiver um, mantenha e ajuste classes/estilos)
const ModalHeader = styled.div`
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  flex: 0 0 auto;
`;

// Corpo rolável
const ModalBody = styled.div`
  padding: 1rem 1.25rem;
  overflow-y: auto;
  flex: 1 1 auto;

  /* melhora o scroll em iOS */
  -webkit-overflow-scrolling: touch;
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
  border-radius: 6px; font-size: 1rem; width: -webkit-fill-available;
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
  const [form, setForm] = useState({
    clientName: '',
    cnpjCpf: '',
    contactName: '',
    contactNumber: '',
    neighborhood: '',
    address: '',
    addressNumber: '',
    city: '',
    cep: '', // ADICIONADO
    type: 'entrega' as 'entrega' | 'retirada' | 'troca',
    motorista: '',
    priority: 0
  });
  const [error, setError] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchClients = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/clients`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    };
    fetchClients();
  }, []);

  // ao selecionar cliente, preencher CEP também
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);

    if (clientId) {
      const selectedClient = clients.find(c => c._id === clientId);
      if (selectedClient) {
        setForm(prev => ({
          ...prev,
          clientName: selectedClient.clientName || '',
          cnpjCpf: selectedClient.cnpjCpf ?? '',
          contactName: selectedClient.contactName || '',
          contactNumber: selectedClient.contactNumber || '',
          neighborhood: selectedClient.neighborhood || '',
          address: selectedClient.address || '',
          addressNumber: selectedClient.addressNumber || '',
          city: selectedClient.city ?? '',
          cep: selectedClient.cep ?? '' // ADICIONADO
        }));
      }
    } else {
      setForm({
        clientName: '',
        cnpjCpf: '',
        contactName: '',
        contactNumber: '',
        neighborhood: '',
        address: '',
        addressNumber: '',
        city: '',
        cep: '', // ADICIONADO
        type: 'entrega',
        motorista: '',
        priority: 0
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
    // envio inclui cep
    const response = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        clientId: selectedClientId,           // OBRIGATÓRIO
        clientName: form.clientName,
        cnpjCpf: form.cnpjCpf,
        city: form.city,
        cep: form.cep, // ADICIONADO
        contactName: form.contactName,
        contactNumber: form.contactNumber,
        neighborhood: form.neighborhood,
        address: form.address,
        addressNumber: form.addressNumber,
        type: form.type,                      // OBRIGATÓRIO
        priority: form.priority,              // número
        motorista: form.motorista || undefined
      }),
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
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>Criar Novo Pedido</Title>
        </ModalHeader>

        <ModalBody>
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
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <Label>Nome do Cliente</Label>
                    <Input
                      type="text"
                      value={form.clientName}
                      onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                      required
                    />
                  </div>
                  <div style={{ flex: '1 1 260px' }}>
                    <Label>CNPJ/CPF</Label>
                    <Input
                      type="text"
                      value={form.cnpjCpf}
                      onChange={e => setForm(f => ({ ...f, cnpjCpf: e.target.value }))}
                      placeholder="00.000.000/0000-00 ou 000.000.000-00"
                    />
                  </div>
                </div>

                <FormGroup>
                  <Label>Nome do Contato</Label>
                  <Input type="text" value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <Label>Número do Contato</Label>
                  <Input type="text" value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} />
                </FormGroup>
                <FormGroup>
                  <Label>Bairro</Label>
                  <Input type="text" value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} />
                </FormGroup>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <Label>Endereço</Label>
                    <Input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <Label>Número</Label>
                    <Input type="text" value={form.addressNumber} onChange={e => setForm(f => ({ ...f, addressNumber: e.target.value }))} />
                  </div>
                  <div style={{ flex: '1 1 220px' }}>
                    <Label>Cidade</Label>
                    <Select
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="São José dos Campos">São José dos Campos</option>
                      <option value="Jacareí">Jacareí</option>
                      <option value="Caçapava">Caçapava</option>
                    </Select>
                  </div>
                  <div style={{ flex: '1 1 180px' }}>
                    <Label>CEP</Label>
                    <Input type="text" value={form.cep} onChange={e => setForm(f => ({ ...f, cep: e.target.value }))} placeholder="00000-000" />
                  </div>
                </div>

                <FormGroup>
                  <Label>Tipo de Pedido</Label>
                  <Select
                    value={form.type}
                    onChange={e => setForm(prev => ({ ...prev, type: e.target.value as 'entrega' | 'retirada' | 'troca' }))}
                  >
                    <option value="entrega">Entrega</option>
                    <option value="retirada">Retirada</option>
                    <option value="troca">Troca</option>
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Atribuir Motorista</Label>
                  <Select
                    value={form.motorista}
                    onChange={e => setForm(prev => ({ ...prev, motorista: e.target.value }))}
                    required={true}
                  >
                    <option value="">Selecione...</option>
                    {drivers.map(driver => (
                      <option key={driver._id} value={driver._id}>{driver.username}</option>
                    ))}
                  </Select>
                </FormGroup>

                <div style={{ display:'flex', gap: 16, flexWrap:'wrap' }}>
                  <div style={{ flex:'1 1 220px' }}>
                    <Label>Prioridade</Label>
                    <Select
                      value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                      required
                    >
                      <option value={0}>Baixa</option>
                      <option value={1}>Média</option>
                      <option value={2}>Alta</option>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <ButtonGroup>
              <SubmitButton type="submit">Criar Pedido</SubmitButton>
              <CancelButton type="button" onClick={onClose}>Cancelar</CancelButton>
            </ButtonGroup>
          </Form>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateOrderModal;