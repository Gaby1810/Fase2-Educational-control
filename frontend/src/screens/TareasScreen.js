import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import API_BASE_URL from '../constants/api';

export default function TareasScreen({ route, navigation }) {
  const { claseId, nombreClase } = route.params;
  const [tareas, setTareas] = useState([]);

  const obtenerTareas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tareas?clase_id=${claseId}`);
      const data = await response.json();
      setTareas(data);
    } catch (error) {
      console.error("Error al obtener tareas:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      obtenerTareas();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.onSurface }]}>Tareas - {nombreClase}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SubirTarea', { claseId })}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {tareas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={80} color={Colors.outline} />
            <Text style={{ color: Colors.onSurfaceVariant, marginTop: 10 }}>No hay tareas asignadas.</Text>
          </View>
        ) : (
          tareas.map((item) => (
            <View key={item.id} style={[styles.tareaCard, { backgroundColor: Colors.surfaceContainerLow }]}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="assignment" size={24} color={Colors.primary} />
                <Text style={[styles.tareaTitle, { color: Colors.onSurface }]}>{item.titulo}</Text>
              </View>
              <Text style={[styles.tareaDesc, { color: Colors.onSurfaceVariant }]} numberOfLines={2}>
                {item.descripcion}
              </Text>
              <View style={styles.divider} />
              <View style={styles.cardFooter}>
                <View style={styles.dateInfo}>
                  <MaterialCommunityIcons name="calendar-clock" size={16} color={Colors.error} />
                  <Text style={[styles.dateText, { color: Colors.error }]}>
                    Entrega: {new Date(item.fecha_entrega).toLocaleDateString()}
                  </Text>
                </View>
                <TouchableOpacity>
                  <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>Ver entregas</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  tareaCard: { borderRadius: 16, padding: 16, marginBottom: 15, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tareaTitle: { fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  tareaDesc: { fontSize: 14, marginBottom: 12 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 12, fontWeight: '600' }
});