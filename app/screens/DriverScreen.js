import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { api, socketService } from '../services/api';

const DriverScreen = () => {
    const user = { username: 'driver_demo', password: 'drive123' };
    const [location, setLocation] = useState({ latitude: 56.8400, longitude: 60.6100 });
    const [orders, setOrders] = useState([]);
    const [activeOrder, setActiveOrder] = useState(null);

    useEffect(() => {
        const socket = socketService.connect((type, data) => {
            if (type === 'NEW_ORDER') {
                setOrders(prev => [...prev, data]);
            }
        });

        // Симуляция обновления геолокации каждые 5 секунд
        const timer = setInterval(() => {
            api.updateLocation(user, { lat: location.latitude, lon: location.longitude });
        }, 5000);

        return () => {
            socket.disconnect();
            clearInterval(timer);
        };
    }, []);

    const acceptOrder = async (orderId) => {
        try {
            await api.acceptOrder(user, orderId);
            setActiveOrder(orders.find(o => o.id === orderId));
            setOrders(prev => prev.filter(o => o.id !== orderId));
            Alert.alert('Успех', 'Заказ принят!');
        } catch (e) {
            Alert.alert('Ошибка', 'Заказ уже занят');
        }
    };

    return (
        <View style={styles.container}>
            <MapView 
                style={styles.map}
                initialRegion={{
                    latitude: 56.8400, longitude: 60.6100,
                    latitudeDelta: 0.05, longitudeDelta: 0.05,
                }}
            >
                <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} title="Вы" pinColor="green" />
                {activeOrder && <Marker coordinate={{ latitude: activeOrder.from_lat, longitude: activeOrder.from_lon }} title="Пассажир" pinColor="blue" />}
            </MapView>

            <View style={styles.orderPanel}>
                <Text style={styles.title}>Доступные заказы:</Text>
                <FlatList 
                    data={orders}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.orderItem}>
                            <Text>Заказ #{item.id} ({item.from_lat.toFixed(3)}, {item.from_lon.toFixed(3)})</Text>
                            <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptOrder(item.id)}>
                                <Text style={styles.btnText}>Принять</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { height: '60%', width: '100%' },
    orderPanel: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    orderItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: 'white', marginBottom: 10, borderRadius: 10, elevation: 2 },
    acceptBtn: { backgroundColor: '#2ecc71', padding: 10, borderRadius: 5 },
    btnText: { color: 'white', fontWeight: 'bold' }
});

export default DriverScreen;
