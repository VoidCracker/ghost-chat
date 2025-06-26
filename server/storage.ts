import { users, rooms, messages, type User, type InsertUser, type Room, type InsertRoom, type Message, type InsertMessage, type MessageWithUser } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool, supabase } from "./db";
import { eq, desc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAllRooms(): Promise<Room[]>;
  getRoomById(id: number): Promise<Room | undefined>;
  getRoomByName(name: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;

  getMessagesByRoom(roomId: number, limit?: number): Promise<MessageWithUser[]>;
  createMessage(message: InsertMessage): Promise<MessageWithUser>;
  deleteMessage(id: number, userId: number): Promise<boolean>;
  getMessageById(id: number): Promise<MessageWithUser | undefined>;

  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    if (!pool || !db) {
      throw new Error("Database not initialized. DATABASE_URL is required.");
    }
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
    this.initializeRooms();
  }

  private async initializeRooms() {
    try {
      const existingRooms = await db.select().from(rooms);
      if (existingRooms.length === 0) {
        await db.insert(rooms).values([
          { name: "General", description: "General discussion" },
          { name: "Random", description: "Random topics" }
        ]);
      }
    } catch (error) {
      console.error('Failed to initialize rooms:', error);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getRoomById(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async getRoomByName(name: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.name, name));
    return room || undefined;
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const [room] = await db
      .insert(rooms)
      .values(insertRoom)
      .returning();
    return room;
  }

  async getMessagesByRoom(roomId: number, limit: number = 50): Promise<MessageWithUser[]> {
    const roomMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        userId: messages.userId,
        roomId: messages.roomId,
        replyToId: messages.replyToId,
        createdAt: messages.createdAt,
        username: users.username,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.roomId, roomId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    const messagesWithUsers: MessageWithUser[] = [];

    for (const message of roomMessages.reverse()) {
      let replyTo: MessageWithUser | undefined;
      if (message.replyToId) {
        replyTo = await this.getMessageById(message.replyToId);
      }

      messagesWithUsers.push({
        id: message.id,
        content: message.content,
        userId: message.userId,
        roomId: message.roomId,
        replyToId: message.replyToId,
        createdAt: message.createdAt,
        user: { id: message.userId, username: message.username },
        replyTo
      });
    }

    return messagesWithUsers;
  }

  async createMessage(insertMessage: InsertMessage): Promise<MessageWithUser> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();

    const user = await this.getUser(message.userId);
    if (!user) {
      throw new Error("User not found");
    }

    let replyTo: MessageWithUser | undefined;
    if (message.replyToId) {
      replyTo = await this.getMessageById(message.replyToId);
    }

    return {
      ...message,
      user: { id: user.id, username: user.username },
      replyTo
    };
  }

  async deleteMessage(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(messages)
      .where(eq(messages.id, id) && eq(messages.userId, userId))
      .returning();

    return result.length > 0;
  }

  async getMessageById(id: number): Promise<MessageWithUser | undefined> {
    const [result] = await db
      .select({
        id: messages.id,
        content: messages.content,
        userId: messages.userId,
        roomId: messages.roomId,
        replyToId: messages.replyToId,
        createdAt: messages.createdAt,
        username: users.username,
      })
      .from(messages)
      .innerJoin(users, eq(messages.userId, users.id))
      .where(eq(messages.id, id));

    if (!result) return undefined;

    let replyTo: MessageWithUser | undefined;
    if (result.replyToId) {
      const [replyResult] = await db
        .select({
          id: messages.id,
          content: messages.content,
          userId: messages.userId,
          roomId: messages.roomId,
          replyToId: messages.replyToId,
          createdAt: messages.createdAt,
          username: users.username,
        })
        .from(messages)
        .innerJoin(users, eq(messages.userId, users.id))
        .where(eq(messages.id, result.replyToId));

      if (replyResult) {
        replyTo = {
          id: replyResult.id,
          content: replyResult.content,
          userId: replyResult.userId,
          roomId: replyResult.roomId,
          replyToId: replyResult.replyToId,
          createdAt: replyResult.createdAt,
          user: { id: replyResult.userId, username: replyResult.username }
        };
      }
    }

    return {
      id: result.id,
      content: result.content,
      userId: result.userId,
      roomId: result.roomId,
      replyToId: result.replyToId,
      createdAt: result.createdAt,
      user: { id: result.userId, username: result.username },
      replyTo
    };
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<number, Room>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentRoomId: number;
  private currentMessageId: number;
  public sessionStore: any;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentRoomId = 1;
    this.currentMessageId = 1;

    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    // Initialize default rooms
    this.initializeRooms();
  }

  private async initializeRooms() {
    await this.createRoom({ name: "General", description: "General discussion" });
    await this.createRoom({ name: "Random", description: "Random topics" });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoomById(id: number): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async getRoomByName(name: string): Promise<Room | undefined> {
    return Array.from(this.rooms.values()).find(
      (room) => room.name === name,
    );
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const id = this.currentRoomId++;
    const room: Room = { 
      ...insertRoom, 
      id,
      description: insertRoom.description || null
    };
    this.rooms.set(id, room);
    return room;
  }

  async getMessagesByRoom(roomId: number, limit: number = 50): Promise<MessageWithUser[]> {
    const roomMessages = Array.from(this.messages.values())
      .filter((message) => message.roomId === roomId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-limit);

    const messagesWithUsers: MessageWithUser[] = [];

    for (const message of roomMessages) {
      const user = await this.getUser(message.userId);
      if (user) {
        let replyTo: MessageWithUser | undefined;
        if (message.replyToId) {
          const replyToMessage = this.messages.get(message.replyToId);
          if (replyToMessage) {
            const replyToUser = await this.getUser(replyToMessage.userId);
            if (replyToUser) {
              replyTo = {
                ...replyToMessage,
                user: { id: replyToUser.id, username: replyToUser.username }
              };
            }
          }
        }

        messagesWithUsers.push({
          ...message,
          user: { id: user.id, username: user.username },
          replyTo
        });
      }
    }

    return messagesWithUsers;
  }

  async createMessage(insertMessage: InsertMessage): Promise<MessageWithUser> {
    const id = this.currentMessageId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: new Date(),
      replyToId: insertMessage.replyToId || null
    };
    this.messages.set(id, message);

    const user = await this.getUser(message.userId);
    if (!user) {
      throw new Error("User not found");
    }

    let replyTo: MessageWithUser | undefined;
    if (message.replyToId) {
      replyTo = await this.getMessageById(message.replyToId);
    }

    return {
      ...message,
      user: { id: user.id, username: user.username },
      replyTo
    };
  }

  async deleteMessage(id: number, userId: number): Promise<boolean> {
    const message = this.messages.get(id);
    if (message && message.userId === userId) {
      this.messages.delete(id);
      return true;
    }
    return false;
  }

  async getMessageById(id: number): Promise<MessageWithUser | undefined> {
    const message = this.messages.get(id);
    if (!message) return undefined;

    const user = await this.getUser(message.userId);
    if (!user) return undefined;

    let replyTo: MessageWithUser | undefined;
    if (message.replyToId) {
      const replyToMessage = this.messages.get(message.replyToId);
      if (replyToMessage) {
        const replyToUser = await this.getUser(replyToMessage.userId);
        if (replyToUser) {
          replyTo = {
            ...replyToMessage,
            user: { id: replyToUser.id, username: replyToUser.username }
          };
        }
      }
    }

    return {
      ...message,
      user: { id: user.id, username: user.username },
      replyTo
    };
  }
}

// Use database storage if DATABASE_URL is available, otherwise use memory storage
// Use Supabase storage if available, otherwise fall back to database or memory
export const storage = supabase ? supabaseStorage : (db ? new DatabaseStorage() : new MemStorage());