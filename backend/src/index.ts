import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { OrderStatus, PrintSettings } from './types';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit per file
});

// Generate a 6-character alphanumeric order number
function generateOrderNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded confusing chars like I, O, 1, 0
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Routes

// 1. Create Order
app.post('/api/orders', upload.array('files'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { paperSize, colorMode, copies, instructions, customerDetails } = req.body;
    
    // Parse copies since FormData sends strings
    const parsedCopies = parseInt(copies) || 1;

    let orderNumber = generateOrderNumber();
    // Ensure uniqueness
    while (await prisma.order.findUnique({ where: { orderNumber } })) {
      orderNumber = generateOrderNumber();
    }

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'Ready to Print',
        customerDetails: customerDetails || null,
        paperSize: paperSize || 'A4',
        colorMode: colorMode || 'Color',
        copies: parsedCopies,
        instructions: instructions || null,
        files: {
          create: files.map(f => ({
            originalName: f.originalname,
            mimeType: f.mimetype,
            size: f.size,
            path: `/uploads/${f.filename}` // relative URL path
          }))
        }
      },
      include: { files: true }
    });

    res.status(201).json({ 
      message: 'Order created successfully',
      orderNumber: order.orderNumber,
      orderId: order.id
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Get All Orders (Admin & Print Agent)
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status: String(status) } : {};
    
    const orders = await prisma.order.findMany({
      where: filter,
      include: { files: true },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get Order by Number (Customer Tracking)
app.get('/api/orders/:orderNumber', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber: req.params.orderNumber },
      include: { files: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Update Order Status (Print Agent or Admin)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses: OrderStatus[] = ['Waiting', 'Ready to Print', 'Printing', 'Printed', 'Failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: { files: true }
    });

    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Delete Order (Admin)
app.delete('/api/orders/:id', async (req, res) => {
  try {
    // Delete associated files from filesystem first
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { files: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    for (const file of order.files) {
      const filename = path.basename(file.path);
      const filePath = path.join(UPLOADS_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from DB (cascade deletion if configured, but let's do manually to be safe)
    await prisma.file.deleteMany({ where: { orderId: req.params.id } });
    await prisma.order.delete({ where: { id: req.params.id } });

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('Cloud Photo Printing System Backend API is running');
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
