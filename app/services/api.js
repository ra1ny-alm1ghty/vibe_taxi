const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://10.0.2.2:3000'; // Стандартный IP для доступа к localhost из Android-эмулятора

const api = {
    // Авторизация через заголовки (как в нашем сервере)
    getHeaders: (user) => ({
        'username': user.username,
        'password': user.password,
        'Content-Type': 'application/json'
    }),

    createOrder: async (user, orderData) => {
        const res = await axios.post(`${BASE_URL}/order`, orderData, { headers: api.getHeaders(user) });
        return res.data;
    },

    acceptOrder: async (user, orderId) => {
        const res = await axios.post(`${BASE_URL}/order/accept`, { orderId }, { headers: api.getHeaders(user) });
        return res.data;
    },

    updateLocation: async (user, location) => {
        const res = await axios.post(`${BASE_URL}/location`, location, { headers: api.getHeaders(user) });
        return res.data;
    },

    adminManageOrder: async (user, orderId, action, driverId = null) => {
        const res = await axios.post(`${BASE_URL}/admin/order/manage`, { orderId, action, driverId }, { headers: api.getHeaders(user) });
        return res.data;
    }
};

const socketService = {
    connect: (onMessageReceived) => {
        const socket = io(BASE_URL);
        socket.on('connect', () => console.log('Connected to Taxi Server'));
        socket.on('new_order', (data) => onMessageReceived('NEW_ORDER', data));
        socket.on('location_update', (data) => onMessageReceived('LOCATION_UPDATE', data));
        socket.on('order_update', (data) => onMessageReceived('ORDER_UPDATE', data));
        return socket;
    }
};

module.exports = { api, socketService };
