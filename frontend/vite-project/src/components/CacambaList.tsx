import React from 'react';
import styled from 'styled-components';
import type { ICacamba } from '../interfaces';

// Styled Components
const EmptyState = styled.div`
  color: #6b7280;
  text-align: center;
  padding: 1rem 0;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Title = styled.h3`
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CacambaCard = styled.div`
  background-color: #f9fafb;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const CardContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const InfoSection = styled.div`
  flex: 1;
`;

const HeaderInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CacambaNumber = styled.span`
  font-weight: 500;
  color: #1f2937;
`;

const TypeBadge = styled.span<{ tipo: 'entrega' | 'retirada' }>`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 9999px;
  background-color: ${props => props.tipo === 'entrega' ? '#dcfce7' : '#fee2e2'};
  color: ${props => props.tipo === 'entrega' ? '#166534' : '#991b1b'};
`;

const DateInfo = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
`;

const ImageContainer = styled.div`
  margin-left: 0.75rem;
`;

const CacambaImage = styled.img`
  width: 4rem;
  height: 4rem;
  object-fit: cover;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
`;

interface CacambaListProps {
  cacambas: ICacamba[];
}

const CacambaList: React.FC<CacambaListProps> = ({ cacambas }) => {
  if (cacambas.length === 0) {
    return (
      <EmptyState>
        Nenhuma caçamba registrada ainda
      </EmptyState>
    );
  }

  return (
    <Container>
      <Title>Caçambas Registradas:</Title>
      {cacambas.map((cacamba) => (
        <CacambaCard key={cacamba._id}>
          <CardContent>
            <InfoSection>
              <HeaderInfo>
                <CacambaNumber>
                  #{cacamba.numero}
                </CacambaNumber>
                <TypeBadge tipo={cacamba.tipo}>
                  {cacamba.tipo === 'entrega' ? 'Entrega' : 'Retirada'}
                </TypeBadge>
              </HeaderInfo>
              <DateInfo>
                Registrada em: {new Date(cacamba.createdAt).toLocaleString('pt-BR')}
              </DateInfo>
            </InfoSection>
            <ImageContainer>
              <CacambaImage
                src={`http://localhost:3001${cacamba.imageUrl}`}
                alt={`Caçamba ${cacamba.numero}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyMEg0MFY0NEgyNFYyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI4IDI0SDM2VjQwSDI4VjI0WiIgZmlsbD0iI0QxRDVEQSIvPgo8L3N2Zz4K';
                }}
              />
            </ImageContainer>
          </CardContent>
        </CacambaCard>
      ))}
    </Container>
  );
};

export default CacambaList;
