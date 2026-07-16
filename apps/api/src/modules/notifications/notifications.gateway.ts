import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('NotificationsGateway');

  handleConnection(client: Socket) { this.logger.log(`Client connected: ${client.id}`); }
  handleDisconnect(client: Socket) { this.logger.log(`Client disconnected: ${client.id}`); }

  @SubscribeMessage('join:admin')
  joinAdmin(@ConnectedSocket() client: Socket) { client.join('admins'); return { event: 'joined', data: 'admins' }; }

  emitStockAlert(data: any) { this.server.to('admins').emit('stock:alert', data); }
  emitNewOrder(data: any) { this.server.to('admins').emit('order:new', data); }
  emitOrderStatus(data: any) { this.server.emit(`order:${data.id}:status`, data); }
}
