import React, { useState, useEffect, type FormEvent } from 'react';
import styled from 'styled-components';
import type { IOrder, ICacamba } from '../interfaces';
import CacambaForm from '../components/CacambaForm';
import CacambaList from '../components/CacambaList';

// Estilos
const DriverContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 1rem;
  font-family: Arial, sans-serif;
`;

const Header = styled.header`
  background-color: #3b82f6;
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  h1 {
    font-size: 1.8rem;
    margin: 0;
    @media (min-width: 768px) {
      font-size: 2.5rem;
    }
  }
`;

const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-top: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
`;

const OrderCard = styled.div`
  background-color: white;
  border-left: 5px solid #3b82f6;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  h3 {
    margin-top: 0;
    color: #333;
  }

  p {
    margin: 0.5rem 0;
    color: #666;
  }

`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
`;

const FileInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const SubmitButton = styled.button`
  background-color: #10b981;
  color: white;
  padding: 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #059669;
  }
`;

const CacambaButton = styled.button`
  background-color: #3b82f6;
  color: white;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-right: 0.5rem;
  
  &:hover {
    background-color: #2563eb;
  }
`;

const CacambaSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
`;

const CacambaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
  background-color: ${props => {
    switch (props.status) {
      case 'concluido': return '#10b981';
      case 'cancelado': return '#ef4444';
      case 'em_andamento': return '#3b82f6';
      default: return '#f59e0b'; // pendente
    }
  }};
`;

// Componente principal da página do motorista
const DriverPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [showCacambaForm, setShowCacambaForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const authenticatedFetch = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sessão expirada. Por favor, faça login novamente.');
      window.location.href = '/';
      throw new Error('Token not found');
    }
    const headers = {
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

  const fetchDriverOrders = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('http://localhost:3001/driver/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverOrders();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleCompleteOrder = async (e: FormEvent, orderId: string) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      alert('Por favor, selecione pelo menos uma foto.');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < selectedFiles.length; i++) {
      formData.append('photos', selectedFiles[i]);
    }

    try {
      const response = await authenticatedFetch(`http://localhost:3001/driver/orders/${orderId}/complete`, {
        method: 'PATCH',
        headers: {
            // Não adicione o 'Content-Type', o FormData faz isso automaticamente
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert('Pedido concluído com sucesso e fotos enviadas!');
        fetchDriverOrders(); // Recarrega a lista de pedidos
      } else {
        alert(data.message || 'Erro ao concluir o pedido.');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Erro ao enviar as fotos.');
    }
  };

  const handleAddCacamba = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowCacambaForm(true);
  };

  const handleCacambaAdded = (cacamba: ICacamba) => {
    // Atualizar a lista de pedidos com a nova caçamba
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === cacamba.orderId 
          ? { ...order, cacambas: [...order.cacambas, cacamba] }
          : order
      )
    );
    setShowCacambaForm(false);
    setSelectedOrderId(null);
  };

  const handleCloseCacambaForm = () => {
    setShowCacambaForm(false);
    setSelectedOrderId(null);
  };

  if (loading) return <DriverContainer>Carregando pedidos...</DriverContainer>;

  return (
    <DriverContainer>
      <Header>
        <h1>Painel do Motorista</h1>
        <p>Pedidos atribuídos a você</p>
      </Header>
      <OrdersGrid>
        {orders.length > 0 ? (
          orders.map(order => (
            <OrderCard key={order._id}>
              <h3>{order.clientName}</h3>
              <p><strong>Tipo:</strong> {order.type}</p>
              <p><strong>Endereço:</strong> {order.address}, {order.addressNumber} - {order.neighborhood}</p>
              <p><strong>Contato:</strong> {order.contactName} ({order.contactNumber})</p>
              <p><strong>Status:</strong> <StatusBadge status={order.status}>{order.status}</StatusBadge></p>

              {order.status !== 'concluido' && (
                <>
                  <CacambaSection>
                    <CacambaHeader>
                      <h4>Caçambas</h4>
                      <CacambaButton onClick={() => handleAddCacamba(order._id)}>
                        + Adicionar Caçamba
                      </CacambaButton>
                    </CacambaHeader>
                    <CacambaList cacambas={order.cacambas || []} />
                  </CacambaSection>

                  <Form onSubmit={(e) => handleCompleteOrder(e, order._id)}>
                    <h4>Concluir Pedido (Anexar Fotos)</h4>
                    <FileInput type="file" multiple onChange={handleFileChange} accept="image/*" />
                    <SubmitButton type="submit">Concluir e Enviar Fotos</SubmitButton>
                  </Form>
                </>
              )}
            </OrderCard>
          ))
        ) : (
          <p>Nenhum pedido atribuído a você no momento.</p>
        )}
      </OrdersGrid>

      {showCacambaForm && selectedOrderId && (
        <CacambaForm
          orderId={selectedOrderId}
          onCacambaAdded={handleCacambaAdded}
          onClose={handleCloseCacambaForm}
        />
      )}
    </DriverContainer>
  );
};

export default DriverPage;