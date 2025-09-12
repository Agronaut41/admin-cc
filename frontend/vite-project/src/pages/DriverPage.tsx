import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { IOrder, ICacamba } from '../interfaces';
import CacambaForm from '../components/CacambaForm';
import CacambaList from '../components/CacambaList';
import EditCacambaModal from '../components/EditCacambaModal'; // Crie este componente conforme instrução abaixo
import { io } from 'socket.io-client';

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

const ImageModal = ({ url, onClose }: { url: string, onClose: () => void }) => (
  <div
    style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}
    onClick={onClose}
  >
    <img
      src={url}
      alt="Visualização"
      style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, background: '#fff' }}
      onClick={e => e.stopPropagation()}
    />
  </div>
);

// Componente principal da página do motorista
const DriverPage: React.FC = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCacambaForm, setShowCacambaForm] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderType, setSelectedOrderType] = useState<'entrega' | 'retirada' | 'troca' | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [editingCacamba, setEditingCacamba] = useState<ICacamba | null>(null);

  const socket = io('http://localhost:3001'); // ajuste a URL se necessário

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

    socket.on('orders_updated', () => {
      fetchDriverOrders();
    });

    return () => {
      socket.off('orders_updated');
    };
  }, []);

  const handleUpdateCacamba = async (cacambaId: string, updatedCacamba: Partial<ICacamba> & { image?: File | null }) => {
    const formData = new FormData();
    
    // Use Object.entries para iterar sobre as propriedades
    Object.entries(updatedCacamba).forEach(([key, value]) => {
      if (key !== 'image' && value !== undefined) {
        formData.append(key, value as string);
      }
    });

    if (updatedCacamba.image) {
      formData.append('image', updatedCacamba.image);
    }

    await authenticatedFetch(`http://localhost:3001/cacambas/${cacambaId}`, {
      method: 'PATCH',
      body: formData,
    });
    setEditingCacamba(null);
    fetchDriverOrders();
  };

  const handleCompleteOrder = async (orderId: string) => {
    if (!window.confirm('Deseja realmente marcar este pedido como concluído?')) return;
    try {
      const response = await authenticatedFetch(`http://localhost:3001/driver/orders/${orderId}/complete`, {
        method: 'PATCH'
      });
      const data = await response.json();
      if (response.ok) {
        alert('Pedido concluído com sucesso!');
        fetchDriverOrders();
      } else {
        alert(data.message || 'Erro ao concluir o pedido.');
      }
    } catch (error) {
      console.error('Erro ao concluir pedido:', error);
      alert('Erro ao concluir pedido.');
    }
  };

  const handleAddCacamba = (orderId: string, orderType: 'entrega' | 'retirada' | 'troca') => {
    setSelectedOrderId(orderId);
    setSelectedOrderType(orderType);
    setShowCacambaForm(true);
  };

  const handleCacambaAdded = (cacamba: ICacamba) => {
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

  const openGoogleMapsRoute = (address: string, number: string, neighborhood: string) => {
    const destination = encodeURIComponent(`${address}, ${number} - ${neighborhood}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
  };

  // Handler para excluir caçamba
  const handleDeleteCacamba = async (cacambaId: string, orderId: string) => {
    if (!window.confirm('Deseja realmente excluir esta caçamba?')) return;
    await authenticatedFetch(`http://localhost:3001/cacambas/${cacambaId}`, {
      method: 'DELETE',
    });
    // Atualize os pedidos após exclusão
    fetchDriverOrders();
  };

  if (loading) return <DriverContainer>Carregando pedidos...</DriverContainer>;

  return (
    <DriverContainer>
      <Header>
        <h1>Painel do Motorista</h1>
      </Header>
      <OrdersGrid>
        {orders
          .filter(order => order.status !== 'concluido') // Apenas pedidos não concluídos
          .map(order => {
            // Regra para mostrar o botão de concluir pedido:
            // - entrega/retirada: pelo menos 1 caçamba
            // - troca: pelo menos 2 caçambas
            const canConclude =
              (order.type === 'troca' && order.cacambas && order.cacambas.length >= 2) ||
              ((order.type === 'entrega' || order.type === 'retirada') && order.cacambas && order.cacambas.length >= 1);

            return (
              <OrderCard key={order._id} status={order.status}>
                <h3>{order.clientName}</h3>
                <p><strong>Tipo:</strong> {order.type}</p>
                <p><strong>Endereço:</strong> {order.address}, {order.addressNumber} - {order.neighborhood}</p>
                <p><strong>Contato:</strong> {order.contactName} ({order.contactNumber})</p>

                {/* Botão Google Maps */}
                <CacambaButton
                  style={{ background: '#ea4335', marginBottom: '0.5rem' }}
                  onClick={() => openGoogleMapsRoute(order.address, order.addressNumber, order.neighborhood)}
                >
                  Ver rota no Google Maps
                </CacambaButton>

                {order.status !== 'concluido' && order.status !== 'cancelado' && (
                  <>
                    <CacambaSection>
                      <CacambaHeader>
                        <h4>Caçambas</h4>
                        <CacambaButton onClick={() => handleAddCacamba(order._id, order.type)}>
                          + Adicionar Caçamba
                        </CacambaButton>
                      </CacambaHeader>
                      <CacambaList
                        cacambas={order.cacambas || []}
                        onImageClick={setModalImage}
                        onEdit={order.status !== 'concluido' ? setEditingCacamba : undefined}
                        onDelete={order.status !== 'concluido' ? (cacambaId) => handleDeleteCacamba(cacambaId, order._id) : undefined}
                      />
                    </CacambaSection>
                    {/* Botão para concluir pedido - só aparece se regra for satisfeita */}
                    {canConclude && (
                      <CacambaButton
                        style={{ marginTop: '1rem', background: '#10b981' }}
                        onClick={() => handleCompleteOrder(order._id)}
                      >
                        Concluir Pedido
                      </CacambaButton>
                    )}
                  </>
                )}
              </OrderCard>
            );
          })
        }
      </OrdersGrid>

      {showCacambaForm && selectedOrderId && selectedOrderType && (
        <CacambaForm
          orderId={selectedOrderId}
          orderType={selectedOrderType}
          onCacambaAdded={handleCacambaAdded}
          onClose={handleCloseCacambaForm}
        />
      )}

      {modalImage && <ImageModal url={modalImage} onClose={() => setModalImage(null)} />}

      {editingCacamba && (
        <EditCacambaModal
          cacamba={editingCacamba}
          onClose={() => setEditingCacamba(null)}
          onSave={handleUpdateCacamba}
        />
      )}
    </DriverContainer>
  );
};

export default DriverPage;