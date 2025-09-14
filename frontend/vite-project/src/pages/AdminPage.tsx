import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { IOrder, IDriver } from '../interfaces';
import CreateOrderModal from '../components/CreateOrderModal';
import CreateDriverModal from '../components/CreateDriverModal';
import CacambaList from '../components/CacambaList';
import ClientPage from './ClientPage';
import { io } from 'socket.io-client';
import { downloadOrderPdf } from '../utils/orderPdf'; // ADIÇÃO

// ==========================================================
// ESTILOS
// ==========================================================
const AdminContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f0f2f5;
  padding: 1rem;
  font-family: Arial, sans-serif;

  @media (min-width: 768px) {
    padding: 2rem;
  }
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

const TabContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  border-bottom: 2px solid #ddd;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button<{ active: boolean }>`
  background-color: ${({ active }) => (active ? '#3b82f6' : 'transparent')};
  color: ${({ active }) => (active ? 'white' : '#555')};
  border: none;
  padding: 1rem 1.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.2s, color 0.2s;
  border-radius: 8px 8px 0 0;
  &:hover {
    background-color: ${({ active }) => (active ? '#2563eb' : '#eee')};
  }
`;

const ContentContainer = styled.div`
  background-color: white;
  padding: 1.5rem;
  border-radius: 0 8px 8px 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
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
  
  &:hover {
    background-color: #2563eb;
  }
  &:disabled {
    background-color: #9bd3ff;
    cursor: not-allowed;
  }
`;

const OrdersGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 1rem;
`;

const OrderCard = styled.div<{ status: IOrder['status'] }>`
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-left: 5px solid ${({ status }) => 
    status === 'pendente' ? '#f59e0b' :
    status === 'em_andamento' ? '#3b82f6' :
    status === 'concluido' ? '#10b981' :
    '#ef4444'
  };
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    color: #333;
    font-size: 1.1rem;
  }
  p {
    margin: 0.3rem 0;
    font-size: 0.9rem;
    color: #666;
  }
  strong {
    color: #333;
  }
`;

const DriverList = styled.ul`
  list-style: none;
  padding: 0;
  margin-top: 1rem;
`;

const DriverItem = styled.li`
  background-color: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 0.8rem;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-weight: bold;
    color: #333;
  }

  div {
    display: flex;
    gap: 0.5rem;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #3b82f6; // Azul
  font-size: 1rem;
  &:hover {
    color: #2563eb;
  }
`;

const ImageContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 1rem;
`;

const OrderImage = styled.img`
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

const CacambaSection = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: #374151;
    font-size: 0.9rem;
  }
`;

const SectionContainer = styled.div`
  margin-bottom: 2rem;
`;

const PriorityButton = styled(Button)`
  padding: 0.5rem;
`;

const IncreasePriorityButton = styled(PriorityButton)`
  background-color: #10b981;
`;

const DecreasePriorityButton = styled(PriorityButton)`
  background-color: #f59e0b;
`;

const DeleteOrderButton = styled(PriorityButton)`
  background-color: #ef4444;
`;

const SelectInput = styled.select`
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
`;

const ActionButton = styled.button`
  background-color: #3b82f6;
  color: white;
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2563eb;
  }
`;

// ==========================================================
// COMPONENTE PRINCIPAL
// ==========================================================
const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'motoristas' | 'clientes' | 'cacambas'>('pedidos');
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [drivers, setDrivers] = useState<IDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para os modais
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<IDriver | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const apiUrl = import.meta.env.VITE_API_URL;

  // Função auxiliar para fazer requisições autenticadas
  const authenticatedFetch = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Sessão expirada. Por favor, faça login novamente.');
      window.location.href = '/';
      throw new Error('Token not found');
    }
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

  // Carregar pedidos e motoristas
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ordersResponse = await authenticatedFetch(`${apiUrl}/orders`);
      const ordersData = await ordersResponse.json();
      setOrders(ordersData);

      const driversResponse = await authenticatedFetch(`${apiUrl}/drivers`);
      const driversData = await driversResponse.json();
      setDrivers(driversData);

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido ao carregar os dados.");
      }
    } finally {
      setLoading(false);
    }
  };

  const socket = io(apiUrl);

  useEffect(() => {
    fetchData();

    socket.on('orders_updated', () => {
      fetchData();
    });

    return () => {
      socket.off('orders_updated');
    };
  }, []);

  // Funções de Gerenciamento de Pedidos
  const handleUpdateOrder = async (orderId: string, updates: Partial<IOrder>) => {
    try {
      const response = await authenticatedFetch(`${apiUrl}/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Pedido atualizado!');
        fetchData();
      } else {
        alert(data.message || 'Erro ao atualizar pedido.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar pedido.');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este pedido?')) return;
    try {
      const response = await authenticatedFetch(`${apiUrl}/orders/${orderId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('Pedido excluído com sucesso!');
        fetchData();
      } else {
        const data = await response.json();
        alert(data.message || 'Erro ao excluir pedido.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir pedido.');
    }
  };

  // Funções para prioridade
  const handleIncreasePriority = (orderId: string, currentPriority: number) => {
    handleUpdateOrder(orderId, { priority: currentPriority + 1 });
  };

  const handleDecreasePriority = (orderId: string, currentPriority: number) => {
    handleUpdateOrder(orderId, { priority: Math.max(0, currentPriority - 1) });
  };

  // Funções de Gerenciamento de Motoristas
  const handleEditDriver = (driver: IDriver) => {
    setEditingDriver(driver);
    setIsDriverModalOpen(true);
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este motorista? Todos os pedidos associados precisarão ser reatribuídos.')) return;
    try {
      const response = await authenticatedFetch(`${apiUrl}/drivers/${driverId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        alert('Motorista excluído com sucesso!');
        fetchData();
      } else {
        const data = await response.json();
        alert(data.message || 'Erro ao excluir motorista.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir motorista.');
    }
  };

  // Agrupa pedidos por motorista
  const ordersByDriver = drivers.reduce((acc, driver) => {
    acc[driver._id] = orders.filter(order => order.motorista?._id === driver._id);
    return acc;
  }, {} as Record<string, IOrder[]>);

  const unassignedOrders = orders.filter(order => !order.motorista);

  if (loading) return <AdminContainer>Carregando...</AdminContainer>;
  if (error) return <AdminContainer>Erro: {error}</AdminContainer>;

  return (
    <AdminContainer>
      {modalImage && <ImageModal url={modalImage} onClose={() => setModalImage(null)} />}

      <Header>
        <h1>Painel de Administração de Caçambas</h1>
      </Header>

      <TabContainer>
        <Tab active={activeTab === 'pedidos'} onClick={() => setActiveTab('pedidos')}>
          Pedidos
        </Tab>
        <Tab active={activeTab === 'clientes'} onClick={() => setActiveTab('clientes')}>
          Clientes
        </Tab>
        <Tab active={activeTab === 'motoristas'} onClick={() => setActiveTab('motoristas')}>
          Motoristas
        </Tab>
      </TabContainer>

      <ContentContainer>
        {activeTab === 'clientes' && (
          <ClientPage />
        )}

        {activeTab === 'pedidos' && (
          <div>
            <ActionButtons>
              <Button onClick={() => setIsOrderModalOpen(true)}>+ Adicionar Pedido</Button>
            </ActionButtons>

            {/* Pedidos Não Atribuídos */}
            <SectionContainer>
              <h2>Pedidos Não Atribuídos</h2>
              {unassignedOrders.length > 0 ? (
                <OrdersGrid>
                  {unassignedOrders.map(order => (
                    <OrderCard key={order._id} status={order.status}>
                      <h3>
                        Pedido #{order.orderNumber} - {order.clientName}
                      </h3>
                      <p><strong>Endereço:</strong> {order.address}, {order.addressNumber} - {order.neighborhood}</p>
                      <p><strong>Contato:</strong> {order.contactName} ({order.contactNumber})</p>
                      <p><strong>Status:</strong> {order.status}</p>
                      <p><strong>Prioridade:</strong> {order.priority}</p>
                      {order.cacambas && order.cacambas.length > 0 && (
                        <CacambaSection>
                          <h4>Caçambas Registradas:</h4>
                          <CacambaList
                            cacambas={order.cacambas || []}
                            onImageClick={setModalImage}
                          />
                        </CacambaSection>
                      )}
                      {order.imageUrls && order.imageUrls.length > 0 && (
                        <div>
                          <h4>Imagens Anexadas:</h4>
                          <ImageContainer>
                            {order.imageUrls.map((url, index) => (
                              <OrderImage
                                key={index}
                                src={`${apiUrl}${url}`}
                                alt={`Imagem ${index + 1}`}
                                onClick={() => setModalImage(`${apiUrl}${url}`)}
                                style={{ cursor: 'pointer' }}
                              />
                            ))}
                          </ImageContainer>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        <IncreasePriorityButton onClick={() => handleIncreasePriority(order._id, order.priority)}>▲ Prioridade</IncreasePriorityButton>
                        <DecreasePriorityButton onClick={() => handleDecreasePriority(order._id, order.priority)}>▼ Prioridade</DecreasePriorityButton>
                        <SelectInput
                          value={order.status}
                          onChange={(e) => handleUpdateOrder(order._id, { status: e.target.value as IOrder['status'] })}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="em_andamento">Em Andamento</option>
                          <option value="concluido">Concluído</option>
                          <option value="cancelado">Cancelado</option>
                        </SelectInput>
                        <SelectInput
                          value={order.motorista?._id || ''}
                          onChange={(e) => handleUpdateOrder(order._id, { motorista: e.target.value || null as any })}
                        >
                          <option value="">Atribuir</option>
                          {drivers.map(d => (
                            <option key={d._id} value={d._id}>{d.username}</option>
                          ))}
                        </SelectInput>
                        <DeleteOrderButton onClick={() => handleDeleteOrder(order._id)}>Excluir</DeleteOrderButton>
                      </div>
                    </OrderCard>
                  ))}
                </OrdersGrid>
              ) : (
                <p>Nenhum pedido não atribuído.</p>
              )}
            </SectionContainer>
            
            {/* Pedidos por Motorista */}
            {drivers.map(driver => {
              const driverOrders = ordersByDriver[driver._id] || [];
              const pendentes = driverOrders.filter(o => o.status !== 'concluido');
              const concluidos = driverOrders
                .filter(o => o.status === 'concluido')
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Mais recente no topo

              return (
                <SectionContainer key={driver._id}>
                  <h2>Pedidos do Motorista: {driver.username}</h2>
                  <h3>Pedidos Pendentes</h3>
                  {pendentes.length > 0 ? (
                    <OrdersGrid>
                      {pendentes.map(order => (
                        <OrderCard key={order._id} status={order.status}>
                          <h3>
                            Pedido #{order.orderNumber} - {order.clientName}
                          </h3>
                          <p><strong>Endereço:</strong> {order.address}, {order.addressNumber} - {order.neighborhood}</p>
                          <p><strong>Contato:</strong> {order.contactName} ({order.contactNumber})</p>
                          {/* <p><strong>Status:</strong> {order.status}</p> */}
                          <p><strong>Prioridade:</strong> {order.priority}</p>
                          {order.cacambas && order.cacambas.length > 0 && (
                            <CacambaSection>
                              <h4>Caçambas Registradas:</h4>
                              <CacambaList
                                cacambas={order.cacambas || []}
                                onImageClick={setModalImage}
                              />
                            </CacambaSection>
                          )}
                          {order.imageUrls && order.imageUrls.length > 0 && (
                            <div>
                              <h4>Imagens Anexadas:</h4>
                              <ImageContainer>
                                {order.imageUrls.map((url, index) => (
                                  <OrderImage
                                    key={index}
                                    src={`${apiUrl}${url}`}
                                    alt={`Imagem ${index + 1}`}
                                    onClick={() => setModalImage(`${apiUrl}${url}`)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                ))}
                              </ImageContainer>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            <IncreasePriorityButton onClick={() => handleIncreasePriority(order._id, order.priority)}>▲ Prioridade</IncreasePriorityButton>
                            <DecreasePriorityButton onClick={() => handleDecreasePriority(order._id, order.priority)}>▼ Prioridade</DecreasePriorityButton>
                            <SelectInput
                              value={order.motorista?._id || ''}
                              onChange={(e) => handleUpdateOrder(order._id, { motorista: e.target.value || null as any })}
                            >
                              <option value="">Desatribuir</option>
                              {drivers.map(d => (
                                <option key={d._id} value={d._id}>{d.username}</option>
                              ))}
                            </SelectInput>
                            <DeleteOrderButton onClick={() => handleDeleteOrder(order._id)}>Excluir</DeleteOrderButton>
                          </div>
                        </OrderCard>
                      ))}
                    </OrdersGrid>
                  ) : (
                    <p>Nenhum pedido pendente para este motorista.</p>
                  )}
                  <h3 style={{ marginTop: '1.5rem' }}>Pedidos Concluídos</h3>
                  {concluidos.length > 0 ? (
                    <OrdersGrid>
                      {concluidos.map(order => (
                        <OrderCard key={order._id} status={order.status}>
                          <h3>
                            Pedido #{order.orderNumber} - {order.clientName}
                          </h3>
                          <p><strong>Endereço:</strong> {order.address}, {order.addressNumber} - {order.neighborhood}</p>
                          <p><strong>Contato:</strong> {order.contactName} ({order.contactNumber})</p>
                          {/* <p><strong>Status:</strong> {order.status}</p> */}
                          {/* Prioridade removida para pedidos concluídos */}
                          {order.cacambas && order.cacambas.length > 0 && (
                            <CacambaSection>
                              <h4>Caçambas Registradas:</h4>
                              <CacambaList
                                cacambas={order.cacambas || []}
                                onImageClick={setModalImage}
                              />
                            </CacambaSection>
                          )}
                          {order.imageUrls && order.imageUrls.length > 0 && (
                            <div>
                              <h4>Imagens Anexadas:</h4>
                              <ImageContainer>
                                {order.imageUrls.map((url, index) => (
                                  <OrderImage
                                    key={index}
                                    src={`${apiUrl}${url}`}
                                    alt={`Imagem ${index + 1}`}
                                    onClick={() => setModalImage(`${apiUrl}${url}`)}
                                    style={{ cursor: 'pointer' }}
                                  />
                                ))}
                              </ImageContainer>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                            <DeleteOrderButton onClick={() => handleDeleteOrder(order._id)}>Excluir</DeleteOrderButton>
                            {order.status === 'concluido' && (
                              <ActionButton
                                type="button"
                                onClick={() => downloadOrderPdf(order)}
                                style={{ background: '#2563eb' }}
                              >
                                Baixar Pedido
                              </ActionButton>
                            )}
                          </div>
                        </OrderCard>
                      ))}
                    </OrdersGrid>
                  ) : (
                    <p>Nenhum pedido concluído para este motorista.</p>
                  )}
                </SectionContainer>
              );
            })}
          </div>
        )}

        {activeTab === 'motoristas' && (
          <div>
            <ActionButtons>
              <Button onClick={() => { setEditingDriver(null); setIsDriverModalOpen(true); }}>+ Adicionar Motorista</Button>
            </ActionButtons>
            <h2>Gerenciar Motoristas</h2>
            <DriverList>
              {drivers.map(driver => (
                <DriverItem key={driver._id}>
                  <span>{driver.username}</span>
                  <div>
                    <IconButton onClick={() => handleEditDriver(driver)}>✏️</IconButton>
                    <IconButton  onClick={() => handleDeleteDriver(driver._id)}>🗑️</IconButton>
                  </div>
                </DriverItem>
              ))}
            </DriverList>
          </div>
        )}
      </ContentContainer>

      {/* Modais */}
      {isOrderModalOpen && (
        <CreateOrderModal
          onClose={() => setIsOrderModalOpen(false)}
          onOrderCreated={fetchData}
          drivers={drivers}
        />
      )}

      {isDriverModalOpen && (
        <CreateDriverModal
          onClose={() => { setIsDriverModalOpen(false); setEditingDriver(null); }}
          onDriverCreated={fetchData}
          editingDriver={editingDriver}
        />
      )}
    </AdminContainer>
  );
};

// Modal simples para imagem
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

export default AdminPage;