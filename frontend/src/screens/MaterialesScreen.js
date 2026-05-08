import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import API_BASE_URL from '../constants/api';

export default function MaterialesScreen({ route, navigation }) {
  const { claseId, nombreClase } = route.params;
  const [materiales, setMateriales] = useState([]);

  const obtenerMateriales = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/materiales?clase_id=${claseId}`);
      const data = await response.json();
      setMateriales(data);
    } catch (error) {
      console.error("Error al obtener materiales:", error);
    }
  };

  useEffect(() => {
    obtenerMateriales();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.onSurface }]}>Materiales - {nombreClase}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SubirMaterial', { claseId })}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.sectionTitle, { color: Colors.onSurfaceVariant }]}>Historial Reciente</Text>
        
        {materiales.length === 0 ? (
          <Text style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>No hay materiales publicados.</Text>
        ) : (
          materiales.map((item) => (
            <View key={item.id} style={[styles.materialCard, { backgroundColor: Colors.surfaceContainerLow }]}>
              <View style={styles.row}>
                <View style={styles.pdfIcon}>
                  <MaterialCommunityIcons name="file-pdf-box" size={35} color={Colors.error} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.materialTitle, { color: Colors.onSurface }]}>{item.titulo}</Text>
                  <Text style={styles.materialDate}>Publicado: {new Date(item.fecha_publicacion).toLocaleDateString()}</Text>
                </View>
                <View style={styles.actionIcons}>
                  <MaterialCommunityIcons name="download" size={22} color={Colors.primary} />
                  <MaterialCommunityIcons name="trash-can-outline" size={22} color={Colors.error} />
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Botón Flotante para subir */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: Colors.primary }]}
        onPress={() => navigation.navigate('SubirMaterial', { claseId })}
      >
        <MaterialCommunityIcons name="plus" size={30} color={Colors.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  materialCard: { borderRadius: 15, padding: 15, marginBottom: 15, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  materialTitle: { fontWeight: 'bold', fontSize: 15 },
  materialDate: { fontSize: 12, color: '#777', marginTop: 2 },
  actionIcons: { flexDirection: 'row', gap: 10 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 }
});