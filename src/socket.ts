import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import Message from './models/Message';

let io: Server;

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', (socket: Socket) => {
    console.log('socket connected', socket.id);
    socket.on('message', async (msg) => {
      try {
        const saved = await Message.create({ text: msg.text, sender: msg.sender, group: msg.group });
        io.emit('message', saved);
      } catch (err) {
        console.error('Failed to save message', err);
        io.emit('message', msg);
      }
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected', socket.id);
    });
  });
}
