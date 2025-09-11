import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ClientList from '../components/ClientList';
import ClientForm from '../components/ClientForm';
import ClientOrdersModal from '../components/ClientOrdersModal'; // Importe o novo modal
import type { IClient } from '../interfaces';

const Container = styled.div`
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0;
  color: #333;
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;

  &:hover {
    background: #2563eb;
  }
`;

const ClientPage: React.FC = () => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<IClient | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Novos estados para o modal de pedidos
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);

  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:3001/clients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        console.error('Erro ao carregar clientes');
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = async (clientData: Omit<IClient, '_id'>) => {
    try {
      const response = await fetch('http://localhost:3001/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(clientData)
      });

      if (response.ok) {
        fetchClients();
        setShowForm(false);
      } else {
        console.error('Erro ao criar cliente');
      }
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
    }
  };

  const handleEditClient = async (clientData: IClient) => {
    if (!editingClient) return;

    try {
      const response = await fetch(`http://localhost:3001/clients/${editingClient._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(clientData)
      });

      if (response.ok) {
        fetchClients();
        setEditingClient(null);
        setShowForm(false);
      } else {
        console.error('Erro ao atualizar cliente');
      }
    } catch (error) {
      console.error('Erro ao editar cliente:', error);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchClients();
      } else {
        console.error('Erro ao excluir cliente');
      }
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
    }
  };

  const handleEditButtonClick = (client: IClient) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleViewOrdersClick = (client: IClient) => {
    setSelectedClient(client);
    setIsOrdersModalOpen(true);
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Container>
      <Header>
        <Title>Gerenciamento de Clientes</Title>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            Adicionar Cliente
          </Button>
        )}
      </Header>

      {showForm ? (
        <ClientForm
          onSubmit={(clientData) => {
            if (editingClient) {
              void handleEditClient({ ...clientData, _id: editingClient._id });
            } else {
              void handleAddClient(clientData);
            }
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingClient(null);
          }}
          initialData={editingClient || undefined}
        />
      ) : (
        <ClientList
          clients={clients}
          onEdit={handleEditButtonClick}
          onDelete={handleDeleteClient}
          onViewOrders={handleViewOrdersClick} // Passe a nova função
        />
      )}

      {/* Renderize o novo modal */}
      {isOrdersModalOpen && selectedClient && (
        <ClientOrdersModal
          client={selectedClient}
          onClose={() => setIsOrdersModalOpen(false)}
        />
      )}
    </Container>
  );
};

export default ClientPage;
