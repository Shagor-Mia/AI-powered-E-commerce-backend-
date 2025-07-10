import { Server } from "socket.io";
import { OrderStatus, PaymentStatus } from "../constants/enum";
import { IProduct } from "../models/product.model";
import { IOrder } from "../models/order.model";
import { IReview } from "../models/review.model";

let io: Server;

export const initializeSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("join", (userId: string) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

export const notifyNewProduct = async (product: IProduct) => {
  io.emit("newProduct", {
    message: `New product added: ${product.name}`,
    product,
  });
};

export const notifyOrderStatus = async (order: IOrder, status: OrderStatus) => {
  io.to(order.buyerId.toString()).emit("orderStatus", {
    message: `Order ${order._id} status updated to ${status}`,
    order,
  });
};

export const notifyPaymentStatus = async (
  order: IOrder,
  paymentStatus: PaymentStatus
) => {
  io.to(order.buyerId.toString()).emit("paymentStatus", {
    message: `Order ${order._id} payment status updated to ${paymentStatus}`,
    order,
  });
};

export const notifyNewReview = async (review: IReview) => {
  io.emit("newReview", {
    message: `New review added for product ${review.productId}`,
    review,
  });
};

export const notifyOffer = async (offer: any) => {
  io.emit("newOffer", {
    message: `New offer available: ${offer.description}`,
    offer,
  });
};
