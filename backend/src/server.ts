// src/server.ts
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import connectDB from './db';
import { UserModel, IUser } from './models/User';
import { OrderModel } from './models/Order';
import { CacambaModel, ICacamba } from './models/Cacamba';
import multer from 'multer'; // Para lidar com upload de arquivos
import path from 'path'; // Para lidar com caminhos de arquivos

const app = express();
const port = 3001;
const JWT_SECRET = 'sua_senha_secreta_aqui';

// Conectar ao banco de dados
connectDB();

// Configurar o Multer para o upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Salva os arquivos na pasta 'uploads'
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// Servir a pasta de uploads estaticamente para que as imagens fiquem acessíveis
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middlewares
app.use(express.json());
app.use(cors());

// Interfaces e Middlewares de autenticação
interface AuthenticatedRequest extends express.Request {
    userData?: { userId: string; role: 'admin' | 'motorista' };
}

const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Autenticação falhou. Token ausente.' });
        }
        const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string; role: 'admin' | 'motorista' };
        req.userData = { userId: decodedToken.userId, role: decodedToken.role };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Autenticação falhou. Token inválido.' });
    }
};

const isAdmin = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.userData || req.userData.role !== 'admin') {
        return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
    }
    next();
};

const isDriver = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.userData || req.userData.role !== 'motorista') {
        return res.status(403).json({ message: 'Acesso negado. Apenas motoristas podem realizar esta ação.' });
    }
    next();
};

// ==========================================================
// ROTA DE LOGIN
// ==========================================================
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await UserModel.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        return res.status(200).json({ message: 'Login bem-sucedido!', token, role: user.role });
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// ==========================================================
// ROTAS DE GERENCIAMENTO DE PEDIDOS (ADMIN)
// ==========================================================

// Criar um novo pedido
app.post('/orders', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
        // Buscar o maior orderNumber existente (ignorando nulos)
        const lastOrder = await OrderModel.findOne({ orderNumber: { $ne: null } }).sort({ orderNumber: -1 });
        const lastNumber = lastOrder && typeof lastOrder.orderNumber === 'number' ? lastOrder.orderNumber : 0;
        const nextOrderNumber = lastNumber + 1;

        const newOrder = new OrderModel({
            ...req.body,
            orderNumber: nextOrderNumber,
        });

        await newOrder.save();
        return res.status(201).json({ message: 'Pedido criado com sucesso!', order: newOrder });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Já existe um pedido com esse número.' });
        }
        console.error('Erro ao criar pedido:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Obter todos os pedidos (com info do motorista e caçambas)
app.get('/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orders = await OrderModel.find().populate([
            {
                path: 'motorista',
                select: 'username'
            },
            {
                path: 'cacambas',
                select: 'numero tipo imageUrl createdAt'
            }
        ]).sort({ priority: -1, createdAt: 1 });
        return res.status(200).json(orders);
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Atualizar um pedido
app.patch('/orders/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
        const updatedOrder = await OrderModel.findByIdAndUpdate(id, { ...updates, updatedAt: Date.now() }, { new: true });
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }
        return res.status(200).json({ message: 'Pedido atualizado com sucesso!', order: updatedOrder });
    } catch (error) {
        console.error('Erro ao atualizar pedido:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Excluir um pedido
app.delete('/orders/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const deletedOrder = await OrderModel.findByIdAndDelete(id);
        if (!deletedOrder) {
            return res.status(404).json({ message: 'Pedido não encontrado.' });
        }
        return res.status(200).json({ message: 'Pedido excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// ==========================================================
// ROTAS DE GERENCIAMENTO DE MOTORISTAS (ADMIN)
// ==========================================================
// Criar um novo motorista
app.post('/drivers', authenticateToken, isAdmin, async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await UserModel.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Usuário já existe.' });
        }
        const newDriver = new UserModel({
            username,
            password,
            role: 'motorista'
        });
        await newDriver.save();
        return res.status(201).json({ message: 'Motorista cadastrado com sucesso!', driver: { id: newDriver._id, username: newDriver.username } });
    } catch (error) {
        console.error('Erro ao cadastrar motorista:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Obter todos os motoristas
app.get('/drivers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const drivers = await UserModel.find({ role: 'motorista' }).select('-password');
        return res.status(200).json(drivers);
    } catch (error) {
        console.error('Erro ao buscar motoristas:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Atualizar um motorista
app.patch('/drivers/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const { username, password } = req.body;
    const updates: Partial<IUser> = {};
    if (username) updates.username = username;
    if (password) updates.password = password;

    try {
        const updatedDriver = await UserModel.findByIdAndUpdate(id, updates, { new: true }).select('-password');
        if (!updatedDriver) {
            return res.status(404).json({ message: 'Motorista não encontrado.' });
        }
        return res.status(200).json({ message: 'Motorista atualizado com sucesso!', driver: { id: updatedDriver._id, username: updatedDriver.username } });
    } catch (error) {
        console.error('Erro ao atualizar motorista:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Excluir um motorista
app.delete('/drivers/:id', authenticateToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const deletedDriver = await UserModel.findByIdAndDelete(id);
        if (!deletedDriver) {
            return res.status(404).json({ message: 'Motorista não encontrado.' });
        }
        return res.status(200).json({ message: 'Motorista excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir motorista:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// ==========================================================
// ROTAS DO MOTORISTA
// ==========================================================
// Obter pedidos do motorista logado
app.get('/driver/orders', authenticateToken, isDriver, async (req: AuthenticatedRequest, res) => {
    try {
        const orders = await OrderModel.find({ motorista: req.userData?.userId }).populate({
            path: 'cacambas',
            select: 'numero tipo imageUrl createdAt'
        }).sort({ priority: -1, createdAt: 1 });
        return res.status(200).json(orders);
    } catch (error) {
        console.error('Erro ao buscar pedidos do motorista:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Registrar caçamba para um pedido
app.post('/driver/orders/:id/cacambas', authenticateToken, isDriver, upload.single('image'), async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { numero, tipo } = req.body;
    const file = req.file;
    
    // Verifique se o pedido pertence ao motorista logado
    const order = await OrderModel.findOne({ _id: id, motorista: req.userData?.userId });
    if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado ou não pertence a este motorista.' });
    }

    if (!file) {
        return res.status(400).json({ message: 'Imagem é obrigatória.' });
    }

    const imageUrl = `/uploads/${file.filename}`;

    try {
        const newCacamba = new CacambaModel({
            numero,
            tipo,
            imageUrl,
            orderId: id
        });
        
        await newCacamba.save();
        
        // Adicionar a caçamba ao pedido
        await OrderModel.findByIdAndUpdate(id, {
            $push: { cacambas: newCacamba._id },
            updatedAt: Date.now()
        });
        
        return res.status(201).json({ message: 'Caçamba registrada com sucesso!', cacamba: newCacamba });
    } catch (error) {
        console.error('Erro ao registrar caçamba:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Obter caçambas de um pedido
app.get('/driver/orders/:id/cacambas', authenticateToken, isDriver, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    
    // Verifique se o pedido pertence ao motorista logado
    const order = await OrderModel.findOne({ _id: id, motorista: req.userData?.userId });
    if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado ou não pertence a este motorista.' });
    }

    try {
        const cacambas = await CacambaModel.find({ orderId: id }).sort({ createdAt: 1 });
        return res.status(200).json(cacambas);
    } catch (error) {
        console.error('Erro ao buscar caçambas:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Atualizar status do pedido para concluído (motorista) - sem anexar fotos
app.patch('/driver/orders/:id/complete', authenticateToken, isDriver, async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    // Verifique se o pedido pertence ao motorista logado
    const order = await OrderModel.findOne({ _id: id, motorista: req.userData?.userId });
    if (!order) {
        return res.status(404).json({ message: 'Pedido não encontrado ou não pertence a este motorista.' });
    }

    try {
        const updatedOrder = await OrderModel.findByIdAndUpdate(
            id,
            { status: 'concluido', updatedAt: Date.now() },
            { new: true }
        );
        return res.status(200).json({ message: 'Pedido concluído com sucesso!', order: updatedOrder });
    } catch (error) {
        console.error('Erro ao concluir pedido:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Editar caçamba (motorista)
app.patch('/cacambas/:id', authenticateToken, isDriver, upload.single('image'), async (req, res) => {
  try {
    const update: any = {
      numero: req.body.numero,
      tipo: req.body.tipo,
    };
    if (req.file) {
      update.imageUrl = '/uploads/' + req.file.filename;
    }
    const cacamba = await CacambaModel.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!cacamba) return res.status(404).json({ message: 'Caçamba não encontrada' });
    res.json(cacamba);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao editar caçamba' });
  }
});

// Excluir caçamba (motorista)
app.delete('/cacambas/:id', authenticateToken, isDriver, async (req, res) => {
  try {
    const cacamba = await CacambaModel.findByIdAndDelete(req.params.id);
    if (!cacamba) return res.status(404).json({ message: 'Caçamba não encontrada' });
    // Remover referência da caçamba do pedido
    await OrderModel.findByIdAndUpdate(cacamba.orderId, { $pull: { cacambas: cacamba._id } });
    res.json({ message: 'Caçamba excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao excluir caçamba' });
  }
});

// Iniciar o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});