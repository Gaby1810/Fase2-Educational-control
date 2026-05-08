import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export default function DetalleMateriaScreen({ route, navigation }) {
  const { clase } = route.params;

  const MenuButton = ({ icon, label, screen, color = Colors.primary, params = {} }) => (
    <TouchableOpacity 
      style={[styles.menuItem, { backgroundColor: Colors.surfaceContainerLow }]}
      onPress={() => navigation.navigate(screen, { 
        claseId: clase.id, 
        nombreClase: clase.nombre,
        ...params 
      })}
    >
      <View style={[styles.menuIconBox, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={28} color={Colors.onPrimary} />
      </View>
      <Text style={[styles.menuLabel, { color: Colors.onSurface }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.onSurface }]}>{clase.nombre}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Tabla de Información de la Clase */}
        <View style={[styles.infoCard, { backgroundColor: Colors.surfaceContainerHigh }]}>
          <InfoRow label="Código de acceso:" value={clase.codigo_clase} isCode />
          <InfoRow label="Grado:" value={clase.grado} />
          <InfoRow label="Sección:" value={clase.seccion || 'N/A'} />
        </View>

        <Text style={[styles.sectionTitle, { color: Colors.onSurfaceVariant }]}>Panel de Control</Text>

        {/* Grid de Botones con las rutas corregidas */}
        <View style={styles.menuGrid}>
          {/* Asistencia */}
          <MenuButton 
            icon="calendar-check" 
            label="Asistencia" 
            screen="Asistencia" 
            color={Colors.secondary} 
          />
          
          {/* Notas (Pasa por Tareas para seleccionar qué calificar) */}
          <MenuButton 
            icon="file-document-edit" 
            label="Notas" 
            screen="Tareas" 
            color={Colors.primary} 
          />

          {/* Gestión de Tareas */}
          <MenuButton 
            icon="clipboard-list" 
            label="Tareas" 
            screen="Tareas" 
            color={Colors.primary} 
          />

          {/* Materiales de Apoyo */}
          <MenuButton 
            icon="folder-open" 
            label="Materiales" 
            screen="Materiales" 
            color={Colors.tertiary} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value, isCode }) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color: Colors.onSurfaceVariant }]}>{label}</Text>
    <Text style={[styles.infoValue, { color: isCode ? Colors.primary : Colors.onSurface, fontWeight: isCode ? 'bold' : 'normal' }]}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  backBtn: { backgroundColor: '#FFF', borderRadius: 10, padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 20 },
  infoCard: { borderRadius: 15, padding: 15, marginBottom: 25 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, marginLeft: 5 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { width: '48%', borderRadius: 15, padding: 20, alignItems: 'center', marginBottom: 15, elevation: 4 },
  menuIconBox: { padding: 12, borderRadius: 12, marginBottom: 10 },
  menuLabel: { fontWeight: 'bold', fontSize: 14 }
});