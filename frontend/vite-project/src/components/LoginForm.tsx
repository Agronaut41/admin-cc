import React from 'react';
import styled from 'styled-components';

// Estilos que você já criou
const FormWrapper = styled.div`
  background-color: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px; // Limita a largura em telas grandes

  // Adiciona a media query para telas menores
  @media (max-width: 480px) {
    padding: 20px; // Reduz o padding no mobile
    width: 80%; // Ocupa 90% da largura da tela
    box-shadow: none;
    border-radius: 0;
  }
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 24px;
  color: #111827;
`;

const Form = styled.form`
  /* Estilos do formulário */
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  color: #4b5563;
  font-size: 0.875rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
  appearance: none;
  border-radius: 0.25rem;
  width: -webkit-fill-available;
  padding: 0.5rem 0.75rem;
  color: #4b5563;
  line-height: 1.25;
  border: 1px solid #e5e7eb;
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
  }
`;

const Button = styled.button`
  background-color: #3b82f6;
  color: white;
  font-weight: bold;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  width: 100%;
  cursor: pointer;
  &:hover {
    background-color: #2563eb;
  }
  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.5);
  }
`;

// Interface para as props
export interface LoginFormProps {
  username: string;
  password: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  loading?: boolean; // ADICIONADO
}

const LoginForm: React.FC<LoginFormProps> = ({
  username,
  password,
  setUsername,
  setPassword,
  onSubmit,
  loading = false, // DEFAULT
}) => {
  return (
    <FormWrapper>
      <Title>Login</Title>
      <Form onSubmit={onSubmit}>
        <FormGroup>
          <Label htmlFor="username">Usuário</Label>
          <Input
            type="text"
            id="username"
            placeholder="Seu nome de usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </FormGroup>
        <FormGroup>
          <Label htmlFor="password">Senha</Label>
          <Input
            type="password"
            id="password"
            placeholder="************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </FormGroup>
        <Button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </Form>
    </FormWrapper>
  );
};

export default LoginForm;