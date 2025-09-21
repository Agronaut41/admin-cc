import React, { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import ClientList from '../components/ClientList';
import ClientForm from '../components/ClientForm';
import ClientOrdersModal from '../components/ClientOrdersModal'; // Importe o novo modal
import type { IClient } from '../interfaces';

const Container = styled.div``;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

   @media (max-width: 480px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const Title = styled.h2`
  margin: 0; // Adicione esta linha para remover as margens padrão do h2
  color: #333;
`;

const AddButton = styled.button`
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

// Barra de filtro
const FilterBar = styled.div`
  display: flex;
  gap: .75rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1rem;
`;
const SearchInput = styled.input`
  flex: 1 1 260px;
  padding: .6rem .8rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: .95rem;
`;

const ClientPage: React.FC = () => {
  const [clients, setClients] = useState<IClient[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<IClient | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Novos estados para o modal de pedidos
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);
  const [search, setSearch] = useState('');
  const apiUrl = import.meta.env.VITE_API_URL;

  const fetchClients = async () => {
    try {
      const response = await fetch(`${apiUrl}/clients`, {
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
      const response = await fetch(`${apiUrl}/clients`, {
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
      const response = await fetch(`${apiUrl}/clients/${editingClient._id}`, {
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
      const response = await fetch(`${apiUrl}/clients/${id}`, {
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

  // normaliza texto para busca (sem acentos)
  const norm = (s: any) =>
    String(s ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  // clients: mantenha sua origem atual (estado já existente no componente)
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients; // clients já existente na página
    const q = norm(search);
    return clients.filter(c => {
      const fields = [
        c.clientName,
        c.cnpjCpf,
        c.address,
        c.addressNumber,
        c.neighborhood,
        c.city,
        c.cep,
        c.contactName,
        c.contactNumber
      ];
      return fields.some(f => norm(f).includes(q));
    });
  }, [clients, search]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <Container>
      <Header>
        <Title>Gerenciamento de Clientes</Title>
        {!showForm && (
          <AddButton onClick={() => setShowForm(true)}>
            Adicionar Cliente
          </AddButton>
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
        <>
          {/* Filtro de clientes */}
          <FilterBar>
            <SearchInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente por nome, CNPJ/CPF, endereço, bairro, cidade, CEP..."
            />
            <span style={{ color:'#6b7280', fontSize:'.9rem' }}>
              {filteredClients.length} de {clients.length} clientes
            </span>
          </FilterBar>

          <ClientList
            clients={filteredClients}
            onEdit={handleEditButtonClick}
            onDelete={handleDeleteClient}
            onViewOrders={handleViewOrdersClick} // Passe a nova função
          />
        </>
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
