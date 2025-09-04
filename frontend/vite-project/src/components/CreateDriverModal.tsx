import React, { useState, FormEvent, useEffect } from 'react';
import styled from 'styled-components';
import type { IDriver } from '../interfaces/index';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 90%;
  width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #555;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;

  label {
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
    color: #555;
  }

  input {
    padding: 0.6rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
`;

const Button = styled.button`
  background-color: #3b82f6;
  color: white;
  padding: 0.8rem 1.2rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  width: 100%;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #2563eb;
  }
`;

interface CreateDriverModalProps {
  onClose: () => void;
  onDriverCreated: () => void;
  editingDriver: IDriver | null;
}

const CreateDriverModal: React.FC<CreateDriverModalProps> = ({ onClose, onDriverCreated, editingDriver }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (editingDriver) {
      setUsername(editingDriver.username);
    } else {
      setUsername('');
      setPassword('');
    }
  }, [editingDriver]);
  
  const authenticatedFetch = async (url: string, options?: RequestInit) => {
    const token = localStorage.getItem('token');
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (editingDriver) {
      // Lógica de atualização
      const updates: { username: string; password?: string } = { username };
      if (password) {
        updates.password = password;
      }
      try {
        const response = await authenticatedFetch(`http://localhost:3001/drivers/${editingDriver._id}`, {
          method: 'PATCH',
          body: JSON.stringify(updates),
        });
        const data = await response.json();
        if (response.ok) {
          alert('Motorista atualizado com sucesso!');
          onDriverCreated();
          onClose();
        } else {
          alert(data.message || 'Erro ao atualizar motorista.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao atualizar motorista.');
      }
    } else {
      // Lógica de criação
      try {
        const response = await authenticatedFetch('http://localhost:3001/drivers', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (response.ok) {
          alert('Motorista cadastrado com sucesso!');
          onDriverCreated();
          onClose();
        } else {
          alert(data.message || 'Erro ao cadastrar motorista.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao cadastrar motorista.');
      }
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2>{editingDriver ? 'Editar Motorista' : 'Adicionar Novo Motorista'}</h2>
        <form onSubmit={handleSubmit}>
          <FormGroup>
            <label>Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </FormGroup>
          <FormGroup>
            <label>Senha {editingDriver && "(deixe vazio para não alterar)"}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!editingDriver}
            />
          </FormGroup>
          <Button type="submit">
            {editingDriver ? 'Atualizar Motorista' : 'Adicionar Motorista'}
          </Button>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateDriverModal;