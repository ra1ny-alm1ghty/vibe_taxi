import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { api, socketService } from './services/api';

const PassengerScreen = () => {
    const user = { username: 'passenger_demo', password: 'pass123' };
    const [location, setLocation] = useState({ latitude: 56.8389, longitude: 60.6057 });
    const [destination, setDestination] = useState({ latitude: 56.8450, longitude: 60.6150 });
    const [orderStatus, setOrderStatus] = useState('IDLE'); // IDLE, PENDING, ACCEPTED, COMPLETED
    const [driverLocation, setDriverLocation] = useState(null);

    useEffect(() => {
        const socket = socketService.connect((type, data) => {
            if (type === 'LOCATION_UPDATE' && data.role === 'driver') {
                setDriverLocation({ latitude: data.lat, longitude: data.lon });
            }
            if (type === 'ORDER_UPDATE' && data.status === 'ACCEPTED') {
                setOrderStatus('ACCEPTED');
            }
        });
        return () => socket.disconnect();
    }, []);

    const createOrder = async () => {
        try {
            const res = await api.createOrder(user, {
                from_lat: location.latitude, from_lon: location.longitude,
                to_lat: destination.latitude, to_lon: destination.longitude
            });
            setOrderStatus('PENDING');
            Alert.alert('Успех', 'Поиск такси...');
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось создать заказ');
        }
    };

    return (
        <View style={styles.container}>
            <MapView 
                style={styles.map}
                initialRegion={{
                    latitude: 56.8389, longitude: 60.6057,
                    latitudeDelta: 0.05, longitudeDelta: 0.05,
                }}
            >
                <Marker coordinate={location} title="Вы" pinColor="blue" />
                <Marker coordinate={destination} title="Цель" pinColor="red" />
                {driverLocation && <Marker coordinate={driverLocation} title="Такси" pinColor="green" />}
            </MapView>
            
            <View style={styles.overlay}>
                <Text style={styles.statusText}>Статус: {orderStatus}</Text>
                <TouchableOpacity style={styles.button} onPress={createOrder}>
                    <Text style={styles.buttonText}>Заказать такси</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { ...StyleSheet.absoluteFillObject },
    overlay: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 5 },
    statusText: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    button: { backgroundColor: '#f1c40f', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { fontSize: 16, fontWeight: 'bold' }
});

export default PassengerScreen;
