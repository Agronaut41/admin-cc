import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import connectDB from './db';
import { UserModel, IUser } from './models/User';
import { OrderModel } from './models/Order';
import { CacambaModel, ICacamba } from './models/Cacamba';
import { ClientModel } from './models/Client';
import multer from 'multer';
import './gridfs';
import { getBucket, uploadBufferToGridFS } from './gridfs'; // ADICIONADO
import { ObjectId } from 'mongodb';
import { createServer } from 'http';                 // ADICIONADO
import { Server as SocketIOServer, Socket } from 'socket.io'; // ADICIONADO

const app = express();
const port = process.env.PORT || 3001;
const server = createServer(app);                    // AJUSTADO
const io = new SocketIOServer(server, {              // AJUSTADO
  cors: { origin: '*' }
});
const JWT_SECRET = process.env.JWT_SECRET;

// Conectar ao banco de dados
connectDB();

// Configurar o Multer para o upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Middlewares
app.use(express.json());
app.use(cors());

// Interfaces e Middlewares de autenticação
interface AuthenticatedRequest extends express.Request {
  userData?: {
    userId: string;
    role: 'admin' | 'motorista';
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401); // Unauthorized
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ message: 'JWT Secret não configurado no servidor.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.sendStatus(403); // Forbidden
    }

    // Verificação de tipo segura
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded && 'role' in decoded) {
      req.userData = {
        userId: (decoded as any).userId,
        role: (decoded as any).role
      };
      next();
    } else {
      // O token decodificado não tem o formato esperado
      return res.status(403).json({ message: 'Token inválido ou malformado.' });
    }
  });
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

        // Adicione esta verificação
        if (!JWT_SECRET) {
            console.error('Erro: JWT_SECRET não está definido nas variáveis de ambiente.');
            return res.status(500).json({ message: 'Erro de configuração interna do servidor.' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' } // alterado de '8h' (ou similar) para 30 dias
        );

        return res.json({
          token,
          role: user.role,
          expiresIn: 30 * 24 * 60 * 60 // em segundos (informativo)
        });
    } catch (e) {
        return res.status(500).json({ message: 'Erro interno' });
    }
});

// ==========================================================
// ROTAS DE GERENCIAMENTO DE PEDIDOS (ADMIN)
// ==========================================================

// Criar um novo pedido
app.post('/orders', authenticateToken, isAdmin, async (req: AuthenticatedRequest, res) => {
  try {
    const { clientId, type, motorista } = req.body;

    if (!clientId) {
      return res.status(400).json({ message: 'ID do cliente é obrigatório.' });
    }

    const client = await ClientModel.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Cliente não encontrado.' });
    }

    const lastOrder = await OrderModel.findOne({ orderNumber: { $ne: null } }).sort({ orderNumber: -1 });
    const nextOrderNumber = (lastOrder?.orderNumber || 0) + 1;

    const newOrder = new OrderModel({
      // Dados do cliente
      clientId: client._id,
      clientName: client.clientName,
      contactName: client.contactName,
      contactNumber: client.contactNumber,
      neighborhood: client.neighborhood,
      address: client.address,
      addressNumber: client.addressNumber,

      // Dados específicos do pedido
      orderNumber: nextOrderNumber,
      type: type,
      motorista: motorista || null,
    });

    await newOrder.save();
    notifyDrivers(); // Notifica via WebSocket, se estiver usando
    return res.status(201).json({ message: 'Pedido criado com sucesso!', order: newOrder });

  } catch (error: any) {
    console.error('Erro ao criar pedido:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Erro de validação', details: error.errors });
    }
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
                select: 'numero tipo imageUrl createdAt local' // <-- Adicione local aqui!
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
        notifyDrivers();
        return res.status(200).json({ message: 'Pedido excluído com sucesso!' });
    } catch (error) {
        console.error('Erro ao excluir pedido:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// ==========================================================
// ROTAS DE GERENCIAMENTO DE CLIENTES
// ==========================================================

// Listar todos os clientes
app.get('/clients', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const clients = await ClientModel.find().sort({ clientName: 1 }); // Alterado de 'name' para 'clientName'
        res.status(200).json(clients);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({ message: 'Erro ao buscar clientes.' });
    }
});

// Criar novo cliente
app.post('/clients', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const { clientName, contactName, contactNumber, neighborhood, address, addressNumber } = req.body;
        
        // Validar dados obrigatórios
        if (!clientName || !contactName || !contactNumber || !neighborhood || !address || !addressNumber) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        const client = new ClientModel({
            clientName, // Alterado de 'name' para 'clientName'
            contactName,
            contactNumber,
            neighborhood,
            address,
            addressNumber
        });

        await client.save();
        res.status(201).json(client);
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        res.status(500).json({ message: 'Erro ao criar cliente.' });
    }
});

// Atualizar cliente
app.patch('/clients/:id', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const client = await ClientModel.findByIdAndUpdate(id, updates, { new: true });
        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }

        res.status(200).json(client);
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        res.status(500).json({ message: 'Erro ao atualizar cliente.' });
    }
});

// Excluir cliente
app.delete('/clients/:id', authenticateToken, isAdmin, async (req: express.Request, res: express.Response) => {
    try {
        const { id } = req.params;

        // Verificar se existem pedidos associados ao cliente
        const orderCount = await OrderModel.countDocuments({ clientId: id });
        if (orderCount > 0) {
            return res.status(400).json({ 
                message: 'Não é possível excluir o cliente pois existem pedidos associados.' 
            });
        }

        const client = await ClientModel.findByIdAndDelete(id);
        if (!client) {
            return res.status(404).json({ message: 'Cliente não encontrado.' });
        }

        res.status(200).json({ message: 'Cliente excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        res.status(500).json({ message: 'Erro ao excluir cliente.' });
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
app.post('/driver/orders/:id/cacambas',
  authenticateToken,
  isDriver,
  upload.single('image'),
  async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { numero, tipo, local } = req.body;

    const order = await OrderModel.findOne({ _id: id, motorista: req.userData?.userId });
    if (!order) {
      return res.status(404).json({ message: 'Pedido não encontrado ou não pertence a este motorista.' });
    }

    const exists = await CacambaModel.findOne({ orderId: order._id, numero: numero.trim() });
    if (exists) {
      return res.status(400).json({ message: 'Número de caçamba já registrado neste pedido.' });
    }

    let finalTipo: 'entrega' | 'retirada';
    if (order.type === 'retirada') finalTipo = 'retirada';
    else if (order.type === 'entrega') finalTipo = 'entrega';
    else finalTipo = (tipo === 'retirada') ? 'retirada' : 'entrega';

    try {
      let imageUrl: string | undefined;
      if (req.file) {
        const fileId = await uploadBufferToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
        imageUrl = `/files/${fileId.toString()}`;
      } else {
        return res.status(400).json({ message: 'Imagem é obrigatória.' });
      }

      const cacamba = await CacambaModel.create({
        numero: numero.trim(),
        tipo: finalTipo,
        local,
        orderId: order._id,
        imageUrl
      });

      await OrderModel.findByIdAndUpdate(id, {
        $push: { cacambas: cacamba._id },
        updatedAt: Date.now()
      });

      return res.status(201).json({ message: 'Caçamba registrada com sucesso!', cacamba });
    } catch (error: any) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Número de caçamba já registrado neste pedido.' });
      }
      console.error('Erro ao registrar caçamba:', error);
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
);

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
        // Notificar todos os admins (emitir evento global)
        io.emit('orders_updated');
        return res.status(200).json({ message: 'Pedido concluído com sucesso!', order: updatedOrder });
    } catch (error) {
        console.error('Erro ao concluir pedido:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// Editar caçamba (motorista) – GRIDFS
app.patch('/cacambas/:id',
  authenticateToken,
  isDriver,
  upload.single('image'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { numero, tipo, local } = req.body;

      const updates: any = {};
      if (numero) updates.numero = numero;
      if (tipo) updates.tipo = (tipo === 'retirada' ? 'retirada' : 'entrega');
      if (local) updates.local = local;

      if (req.file) {
        const fileId = await uploadBufferToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
        updates.imageUrl = `/files/${fileId.toString()}`;
      }

      const cacamba = await CacambaModel.findByIdAndUpdate(id, updates, { new: true });
      if (!cacamba) return res.status(404).json({ message: 'Caçamba não encontrada' });

      return res.json({ cacamba });
    } catch (e) {
      console.error('Erro ao editar caçamba:', e);
      return res.status(500).json({ message: 'Erro ao editar caçamba' });
    }
  }
);

// Excluir caçamba (motorista) – mantém, sem alteração de imagem
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

// Mapeia userId -> socket.id[]
const driverSockets: Record<string, Set<string>> = {};

io.on('connection', (socket: Socket) => {            // TIPADO
  // Motorista envia seu userId após conectar
  socket.on('register_driver', (userId: string) => {
    if (!driverSockets[userId]) driverSockets[userId] = new Set();
    driverSockets[userId].add(socket.id);
  });

  socket.on('disconnect', () => {
    // Remove socket de todos os arrays
    Object.values(driverSockets).forEach(set => set.delete(socket.id));
  });
});

// Função para notificar só o motorista específico
const notifyDriver = (driverId: string) => {
  const sockets = driverSockets[driverId];
  if (sockets) {
    sockets.forEach(socketId => {
      io.to(socketId).emit('orders_updated');
    });
  }
};

// Notifique motoristas via socket
const notifyDrivers = () => {
  io.emit('orders_updated');
};

// Altere para usar server.listen
server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

// Listar pedidos de um cliente específico com filtros
app.get('/clients/:id/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, type, local } = req.query;

    const query: any = { clientId: id };

    // Filtro de data
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    // Filtro de tipo de pedido
    if (type) {
      query.type = type;
    }
    
    // Filtro de local da caçamba (requer uma consulta mais complexa)
    if (local) {
        // Encontra caçambas com o local especificado
        const cacambas = await CacambaModel.find({ local: local as string }).select('_id');
        const cacambaIds = cacambas.map(c => c._id);
        // Filtra pedidos que contenham qualquer uma dessas caçambas
        query.cacambas = { $in: cacambaIds };
    }

    const orders = await OrderModel.find(query)
      .populate('cacambas')
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error('Erro ao buscar pedidos do cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor.' });
  }
});

// Rota para servir arquivos do GridFS
app.get('/files/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const bucket = getBucket();
    const _id = new ObjectId(id);

    const files = await bucket.find({ _id }).toArray();
    if (!files || !files[0]) return res.status(404).json({ message: 'Arquivo não encontrado' });

    res.setHeader('Content-Type', files[0].contentType || 'application/octet-stream');
    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.on('error', () => res.status(500).end());
    downloadStream.pipe(res);
  } catch {
    return res.status(400).json({ message: 'ID inválido' });
  }
});