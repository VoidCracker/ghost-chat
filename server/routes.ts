import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertMessageSchema } from "@shared/schema";

interface WebSocketClient extends WebSocket {
  userId?: number;
  roomId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Room routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getAllRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  // Message routes
  app.get("/api/rooms/:roomId/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const messages = await storage.getMessagesByRoom(roomId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.delete("/api/messages/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const messageId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const deleted = await storage.deleteMessage(messageId, userId);
      if (deleted) {
        res.sendStatus(200);
      } else {
        res.status(403).json({ message: "Cannot delete this message" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<number, Set<WebSocketClient>>();

  wss.on('connection', (ws: WebSocketClient, req) => {
    console.log('New WebSocket connection from:', req.socket.remoteAddress);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'auth':
            console.log(`User ${message.userId} authenticating for room ${message.roomId}`);
            // Handle authentication - in a real app, verify session
            ws.userId = message.userId;
            ws.roomId = message.roomId;
            
            if (!clients.has(message.roomId)) {
              clients.set(message.roomId, new Set());
            }
            clients.get(message.roomId)!.add(ws);
            
            // Send user count update
            broadcastToRoom(message.roomId, {
              type: 'userCount',
              count: clients.get(message.roomId)?.size || 0
            });
            
            // Send success response
            ws.send(JSON.stringify({
              type: 'authSuccess',
              roomId: message.roomId
            }));
            break;

          case 'message':
            if (!ws.userId || !ws.roomId) return;
            
            // Validate message
            const validatedMessage = insertMessageSchema.parse({
              content: message.content,
              userId: ws.userId,
              roomId: ws.roomId,
              replyToId: message.replyToId || null
            });

            // Save message
            const savedMessage = await storage.createMessage(validatedMessage);
            
            // Broadcast to all clients in the room
            broadcastToRoom(ws.roomId, {
              type: 'newMessage',
              message: savedMessage
            });
            break;

          case 'typing':
            if (!ws.userId || !ws.roomId) return;
            
            // Broadcast typing status to other users in the room
            broadcastToRoom(ws.roomId, {
              type: 'typing',
              userId: ws.userId,
              username: message.username,
              isTyping: message.isTyping
            }, ws);
            break;

          case 'joinRoom':
            // Leave current room
            if (ws.roomId && clients.has(ws.roomId)) {
              clients.get(ws.roomId)!.delete(ws);
              broadcastToRoom(ws.roomId, {
                type: 'userCount',
                count: clients.get(ws.roomId)?.size || 0
              });
            }
            
            // Join new room
            ws.roomId = message.roomId;
            if (!clients.has(message.roomId)) {
              clients.set(message.roomId, new Set());
            }
            clients.get(message.roomId)!.add(ws);
            
            broadcastToRoom(message.roomId, {
              type: 'userCount',
              count: clients.get(message.roomId)?.size || 0
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      if (ws.roomId && clients.has(ws.roomId)) {
        clients.get(ws.roomId)!.delete(ws);
        broadcastToRoom(ws.roomId, {
          type: 'userCount',
          count: clients.get(ws.roomId)?.size || 0
        });
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  function broadcastToRoom(roomId: number, message: any, excludeWs?: WebSocketClient) {
    const roomClients = clients.get(roomId);
    if (roomClients) {
      const messageString = JSON.stringify(message);
      roomClients.forEach((client) => {
        if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
          client.send(messageString);
        }
      });
    }
  }

  return httpServer;
}
