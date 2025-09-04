import React from 'react';
import styled from 'styled-components';

// Estilos que você já criou
const FormWrapper = styled.div`
  padding: 2rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1.5rem;
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
  width: 100%;
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
interface LoginFormProps {
    username: string;
    password: string;
    setUsername: (username: string) => void;
    setPassword: (password: string) => void;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
    username,
    password,
    setUsername,
    setPassword,
    onSubmit,
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
                <Button type="submit">Entrar</Button>
            </Form>
        </FormWrapper>
    );
};

export default LoginForm;