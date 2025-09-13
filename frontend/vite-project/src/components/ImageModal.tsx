import React from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  max-width: 90vw;
  max-height: 90vh;
`;

const ModalImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

interface ImageModalProps {
  url: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ url, onClose }) => {
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent>
        <ModalImage src={url} alt="Imagem ampliada" />
      </ModalContent>
    </ModalOverlay>
  );
};

export default ImageModal;