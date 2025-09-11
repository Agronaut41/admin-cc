import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`;

const Th = styled.th`
  background: #f4f4f4;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ddd;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
`;

const Tr = styled.tr`
  &:hover {
    background: #f8f8f8;
  }
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  margin: 0 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  
  &.edit {
    background: #3b82f6;
    color: white;
    &:hover { background: #2563eb; }
  }
  
  &.delete {
    background: #ef4444;
    color: white;
    &:hover { background: #dc2626; }
  }
`;

import type { IClient } from '../interfaces';

interface Props {
  clients: IClient[];
  onEdit: (client: IClient) => void;
  onDelete: (id: string) => void;
  onViewOrders: (client: IClient) => void; // Adicione esta linha
}

const ClientList: React.FC<Props> = ({ clients, onEdit, onDelete, onViewOrders }) => {
  return (
    <Container>
      <Table>
        <thead>
          <tr>
            <Th>Nome do Cliente</Th>
            <Th>Nome do Contato</Th>
            <Th>Número</Th>
            <Th>Bairro</Th>
            <Th>Endereço</Th>
            <Th>Número</Th>
            <Th>Ações</Th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <Tr key={client._id}>
              <Td>{client.name}</Td>
              <Td>{client.contactName}</Td>
              <Td>{client.contactNumber}</Td>
              <Td>{client.neighborhood}</Td>
              <Td>{client.address}</Td>
              <Td>{client.addressNumber}</Td>
              <Td>
                <ActionButton 
                  className="edit" 
                  onClick={() => onEdit(client)}
                >
                  Editar
                </ActionButton>
                <ActionButton 
                  onClick={() => onViewOrders(client)} 
                  style={{ background: '#10b981' }}
                >
                  Ver Pedidos
                </ActionButton>
                <ActionButton 
                  className="delete" 
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
                      onDelete(client._id);
                    }
                  }}
                  color="#ef4444"
                >
                  Excluir
                </ActionButton>
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default ClientList;
