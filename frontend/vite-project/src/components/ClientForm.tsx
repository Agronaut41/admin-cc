import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const FormContainer = styled.div`
  max-width: 600px;
  margin: 20px auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &.primary {
    background: #3b82f6;
    color: white;
    &:hover { background: #2563eb; }
  }

  &.secondary {
    background: #e5e7eb;
    color: #374151;
    &:hover { background: #d1d5db; }
  }
`;

import type { IClient } from '../interfaces';

interface Props {
  onSubmit: (client: Omit<IClient, '_id'>) => void;
  onCancel: () => void;
  initialData?: IClient;
}

const ClientForm: React.FC<Props> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    clientName: '', // Alterado de 'name' para 'clientName'
    contactName: '',
    contactNumber: '',
    neighborhood: '',
    address: '',
    addressNumber: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        clientName: initialData.clientName || '', // Alterado de 'name' para 'clientName'
        contactName: initialData.contactName || '',
        contactNumber: initialData.contactNumber || '',
        neighborhood: initialData.neighborhood || '',
        address: initialData.address || '',
        addressNumber: initialData.addressNumber || '',
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <FormContainer>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="clientName">Nome do Cliente</Label>
          <Input
            id="clientName"
            name="clientName" // O 'name' do input deve corresponder ao estado
            type="text"
            value={formData.clientName} // Use formData.clientName
            onChange={handleChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="contactName">Nome do Contato</Label>
          <Input
            id="contactName"
            name="contactName"
            type="text"
            value={formData.contactName}
            onChange={handleChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="contactNumber">Número do Contato</Label>
          <Input
            id="contactNumber"
            name="contactNumber"
            type="text"
            value={formData.contactNumber}
            onChange={handleChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            name="neighborhood"
            type="text"
            value={formData.neighborhood}
            onChange={handleChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="addressNumber">Número</Label>
          <Input
            id="addressNumber"
            name="addressNumber"
            type="text"
            value={formData.addressNumber}
            onChange={handleChange}
            required
          />
        </FormGroup>

        <ButtonGroup>
          <Button type="submit" className="primary">
            {initialData ? 'Atualizar' : 'Cadastrar'}
          </Button>
          <Button type="button" className="secondary" onClick={onCancel}>
            Cancelar
          </Button>
        </ButtonGroup>
      </Form>
    </FormContainer>
  );
};

export default ClientForm;
