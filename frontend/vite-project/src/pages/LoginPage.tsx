import React, { useState } from 'react';
import styled from 'styled-components';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom'; // Importe useNavigate

// O componente de formulário que você já tem
import LoginForm from '../components/LoginForm';

// Estilos
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f3f4f6;
`;

const ErrorMessage = styled.p`
  color: #ef4444;
  text-align: center;
  margin-top: 1rem;
`;

interface JwtPayload {
    userId: string;
    role: 'admin' | 'motorista';
}

const LoginPage: React.FC = () => {
    const navigate = useNavigate(); // Inicializa o hook de navegação

    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null); // Limpa o erro anterior

        try {
            // Requisição para o backend
            const response = await fetch(`${apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login bem-sucedido
                const decodedToken = jwtDecode<JwtPayload>(data.token);
                
                // Salve o token para futuras requisições
                localStorage.setItem('token', data.token);

                // Redireciona o usuário com base no papel
                if (decodedToken.role === 'admin') {
                    alert('Login de Administrador bem-sucedido! Redirecionando para o painel de administração...');
                    navigate('/admin'); // Redireciona para a rota '/admin'
                } else if (decodedToken.role === 'motorista') {
                    alert('Login de Motorista bem-sucedido! Redirecionando para a rota de trabalho...');
                    navigate('/motorista');
                }

            } else {
                // Login falhou
                setError(data.message || 'Falha no login. Verifique suas credenciais.');
            }
        } catch (err) {
            setError('Ocorreu um erro na requisição. Tente novamente mais tarde.');
        }
    };

    return (
        <Container>
            <div>
                <LoginForm
                    username={username}
                    password={password}
                    setUsername={setUsername}
                    setPassword={setPassword}
                    onSubmit={handleSubmit}
                />
                {error && <ErrorMessage>{error}</ErrorMessage>}
            </div>
        </Container>
    );
};

export default LoginPage;