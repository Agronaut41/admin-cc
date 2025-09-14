import React, { useState } from 'react'; // Remova 'useEffect' daqui
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
  orderType?: 'entrega' | 'retirada' | 'troca';
}

const EditCacambaModal: React.FC<EditCacambaModalProps> = ({ cacamba, onClose, onUpdate, orderType }) => {
  // força o tipo inicial conforme o tipo do pedido (mesma regra do adicionar)
  const forcedTipo: 'entrega' | 'retirada' =
    orderType === 'retirada'
      ? 'retirada'
      : orderType === 'entrega'
        ? 'entrega'
        : (cacamba.tipo === 'retirada' ? 'retirada' : 'entrega');

  const [numero, setNumero] = useState(cacamba.numero);
  const [tipo, setTipo] = useState<'entrega' | 'retirada'>(forcedTipo);
  const [formData, setFormData] = useState({ local: cacamba.local });
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false); // <-- ADICIONADO

  const apiUrl = import.meta.env.VITE_API_URL; // <-- ADICIONADO

  // quais opções mostrar (idêntico ao formulário de adicionar)
  const showEntrega = !orderType || orderType === 'entrega' || orderType === 'troca';
  const showRetirada = !orderType || orderType === 'retirada' || orderType === 'troca';

  // se o pedido não permite trocar o tipo, bloqueia o select
  const lockSelect = orderType === 'entrega' || orderType === 'retirada';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
  };

  // SUBSTITUÍDO: agora faz a requisição PATCH diretamente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append('numero', numero);
      fd.append('tipo', tipo);
      fd.append('local', formData.local);
      if (image) fd.append('image', image);

      const token = localStorage.getItem('token') || '';
      const resp = await fetch(`${apiUrl}/cacambas/${cacamba._id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });

      if (!resp.ok) {
        console.error('Falha ao atualizar caçamba');
      } else {
        const data = await resp.json();
        // mantém compatibilidade: envia objeto retornado (possui os campos esperados)
        onUpdate(data.cacamba || { numero, tipo, local: formData.local, imageUrl: cacamba.imageUrl });
        onClose();
      }
    } catch (err) {
      console.error('Erro na atualização da caçamba', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <Title>Editar Caçamba #{cacamba.numero}</Title>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>Número da Caçamba</Label>
            <Input
              type="text"
              value={numero}
              onChange={e => setNumero(e.target.value)}
              placeholder="Ex: 501"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Tipo</Label>
            <Select
              value={tipo}
              onChange={e => setTipo(e.target.value as 'entrega' | 'retirada')}
              required
              disabled={lockSelect}
            >
              {showEntrega && <option value="entrega">Entrega</option>}
              {showRetirada && <option value="retirada">Retirada</option>}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Local</Label>
            <Select name="local" value={formData.local} onChange={handleChange}>
              <option value="via_publica">Via Pública</option>
              <option value="canteiro_obra">Canteiro de Obra</option>
            </Select>
          </FormGroup>

          <FormGroup>
            <Label>Trocar Imagem (Opcional)</Label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />
          </FormGroup>

          <ButtonGroup>
            <SubmitButton type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Alterações'}</SubmitButton>
            <CancelButton type="button" onClick={onClose} disabled={saving}>Cancelar</CancelButton>
          </ButtonGroup>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EditCacambaModal;