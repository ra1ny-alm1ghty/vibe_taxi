import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PassengerScreen from './screens/PassengerScreen';
import DriverScreen from './screens/DriverScreen';
import AdminScreen from './screens/AdminScreen';

export default function App() {
    const [role, setRole] = useState('passenger'); // 'passenger', 'driver', 'admin'

    return (
        <View style={styles.container}>
            <View style={styles.nav}>
                <TouchableOpacity onPress={() => setRole('passenger')} style={[styles.navBtn, role === 'passenger' && styles.activeBtn]}>
                    <Text style={styles.navText}>Пассажир</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRole('driver')} style={[styles.navBtn, role === 'driver' && styles.activeBtn]}>
                    <Text style={styles.navText}>Таксист</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setRole('admin')} style={[styles.navBtn, role === 'admin' && styles.activeBtn]}>
                    <Text style={styles.navText}>Админ</Text>
                </TouchableOpacity>
            </View>

            {role === 'passenger' && <PassengerScreen />}
            {role === 'driver' && <DriverScreen />}
            {role === 'admin' && <AdminScreen />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    nav: { flexDirection: 'row', backgroundColor: '#2c3e50', paddingVertical: 10, justifyContent: 'space-around' },
    navBtn: { padding: 10, borderRadius: 5 },
    activeBtn: { backgroundColor: '#3498db' },
    navText: { color: 'white', fontWeight: 'bold' }
});
