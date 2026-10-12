import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { api, socketService } from '../services/api';

const AdminScreen = () => {
    const user = { username: 'admin_demo', password: 'admin123' };
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        // В реальности тут был бы запрос GET /admin/orders
        // Для демо-версии будем имитировать получение списка активных заказов
        setOrders([{ id: 1, status: 'PENDING' }, { id: 2, status: 'ACCEPTED' }]);
    }, []);

    const manageOrder = async (orderId, action) => {
        try {
            await api.adminManageOrder(user, orderId, action);
            Alert.alert('Успех', `Заказ ${orderId} ${action === 'CANCEL' ? 'отменен' : 'назначен'}`);
        } catch (e) {
            Alert.alert('Ошибка', 'Не удалось изменить статус заказа');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Панель Администратора</Text>
            <FlatList 
                data={orders}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.orderText}>Заказ #{item.id} - Статус: {item.status}</Text>
                        <View style={styles.btnRow}>
                            <TouchableOpacity style={styles.assignBtn} onPress={() => manageOrder(item.id, 'ASSIGN')}>
                                <Text style={styles.btnText}>Назначить</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => manageOrder(item.id, 'CANCEL')}>
                                <Text style={styles.btnText}>Отменить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#ecf0f1' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#2c3e50' },
    card: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 15, elevation: 3 },
    orderText: { fontSize: 18, marginBottom: 15 },
    btnRow: { flexDirection: 'row', justifyContent: 'space-around' },
    assignBtn: { backgroundColor: '#3498db', padding: 10, borderRadius: 5, minWidth: 100, alignItems: 'center' },
    cancelBtn: { backgroundColor: '#e74c3c', padding: 10, borderRadius: 5, minWidth: 100, alignItems: 'center' },
    btnText: { color: 'white', fontWeight: 'bold' }
});

export default AdminScreen;
