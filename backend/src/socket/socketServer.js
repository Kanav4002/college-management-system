const { Server } = require('socket.io');

const corsOptions = require('../config/cors');
const { verifyToken } = require('../services/jwt.service');
const chatService = require('../services/chat.service');
const logger = require('../utils/logger');

const onlineUsers = new Map();

function publicUser(socket) {
  return {
    id: socket.user.id,
    name: socket.user.name,
    email: socket.user.email,
    role: socket.user.role,
    groupId: socket.user.groupId,
  };
}

function setupSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: corsOptions,
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication required'));
      const payload = verifyToken(token);
      socket.user = {
        id: payload.id,
        email: payload.sub,
        role: payload.role,
        name: payload.name,
        groupId: payload.groupId || null,
      };
      return next();
    } catch (error) {
      return next(error);
    }
  });

  io.on('connection', (socket) => {
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);

    const currentSockets = onlineUsers.get(socket.user.id) || new Set();
    currentSockets.add(socket.id);
    onlineUsers.set(socket.user.id, currentSockets);

    io.emit('presence:update', {
      userId: socket.user.id,
      online: true,
      user: publicUser(socket),
    });

    socket.on('chat:join', async (chatId, ack) => {
      try {
        await chatService.getAccessibleChat(socket.user, chatId);
        socket.join(`chat:${chatId}`);
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on('message:send', async ({ chatId, ...payload }, ack) => {
      try {
        const message = await chatService.sendMessage(socket.user, chatId, payload);
        io.to(`chat:${chatId}`).emit('message:new', message);
        ack?.({ ok: true, data: message });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on('message:edit', async ({ messageId, text }, ack) => {
      try {
        const message = await chatService.editMessage(socket.user, messageId, text);
        io.to(`chat:${message.chat}`).emit('message:updated', message);
        ack?.({ ok: true, data: message });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on('message:delete', async ({ messageId, chatId }, ack) => {
      try {
        await chatService.deleteMessage(socket.user, messageId);
        io.to(`chat:${chatId}`).emit('message:deleted', { messageId, chatId });
        ack?.({ ok: true });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on('typing:start', async ({ chatId }) => {
      try {
        await chatService.getAccessibleChat(socket.user, chatId);
        socket.to(`chat:${chatId}`).emit('typing:update', {
          chatId,
          user: publicUser(socket),
          typing: true,
        });
      } catch {
        // The REST layer will report permission errors for direct actions.
      }
    });

    socket.on('typing:stop', ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit('typing:update', {
        chatId,
        user: publicUser(socket),
        typing: false,
      });
    });

    socket.on('messages:read', async ({ chatId }, ack) => {
      try {
        const receipt = await chatService.markRead(socket.user, chatId);
        io.to(`chat:${chatId}`).emit('messages:read', receipt);
        ack?.({ ok: true, data: receipt });
      } catch (error) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(socket.user.id);
      if (!sockets) return;
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(socket.user.id);
        io.emit('presence:update', {
          userId: socket.user.id,
          online: false,
          user: publicUser(socket),
        });
      }
    });
  });

  logger.info('Socket.IO server attached');
  return io;
}

module.exports = { setupSocketServer };
