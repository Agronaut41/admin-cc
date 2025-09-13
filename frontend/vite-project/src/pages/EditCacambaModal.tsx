import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import type { ICacamba } from '../interfaces';

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center; z-index: 100;
`;
const ModalContent = styled.div`
  background-color: white; border-radius: 8px; padding: 1.5rem 2rem;
  width: 90%; max-width: 500px;
`;
const Title = styled.h2`
  margin: 0 0 1.5rem 0;
`;
const Form = styled.form`
  display: flex; flex-direction: column; gap: 1rem;
`;
const FormGroup = styled.div`
  display: flex; flex-direction: column;
`;
const Label = styled.label`
  font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem;
`;
const Input = styled.input`
  padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;
`;
const Select = styled.select`
  padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 4px;
`;
const ButtonGroup = styled.div`
  display: flex; gap: 1rem; margin-top: 1.5rem;
`;
const Button = styled.button`
  flex: 1; padding: 0.75rem; border: none; border-radius: 6px; cursor: pointer;
  font-size: 1rem;
`;
const SubmitButton = styled(Button)`
  background-color: #2563eb; color: white;
`;
const CancelButton = styled(Button)`
  background-color: #e5e7eb;
`;

interface EditCacambaModalProps {
  cacamba: ICacamba;
  onClose: () => void;
  onUpdate: (updatedData: Partial<ICacamba> & { image?: File | null }) => void;
}

const EditCacambaModal: React.FC<EditCacambaModalProps> = ({ cacamba, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    numero: cacamba.numero,
    status: cacamba.status,
    local: cacamba.local,
  });
  const [image, setImage] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ ...formData, image });
    onClose();
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>Editar Caçamba #{cacamba.numero}</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Status</Label>
            <Select name="status" value={formData.status} onChange={handleChange}>
              <option value="disponivel">Disponível</option>
              <option value="em_uso">Em Uso</option>
              <option value="manutencao">Manutenção</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Local</Label>
            <Select name="local" value={formData.local} onChange={handleChange}>
              <option value="patio">Pátio</option>
              <option value="via_publica">Via Pública</option>
              <option value="canteiro_obra">Canteiro de Obra</option>
            </Select>
          </FormGroup>
          <FormGroup>
            <Label>Trocar Imagem (Opcional)</Label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />
          </FormGroup>
          <ButtonGroup>
            <SubmitButton type="submit">Salvar Alterações</SubmitButton>
            <CancelButton type="button" onClick={onClose}>Cancelar</CancelButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EditCacambaModal;