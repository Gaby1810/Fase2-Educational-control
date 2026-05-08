import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

export default function NotasScreen({ route, navigation }) {
  // Extraemos los parámetros de la tarea seleccionada
  const { tareaId, tareaNombre } = route.params || { tareaNombre: 'Tarea Seleccionada' };
  
  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  // Datos de ejemplo (sustituir por fetch a tu API con el tareaId)
  const estudiantes = [
    { id: 1, nombre: 'Garcia, Alejandro', estado: 'ENTREGADO', tiempo: 'hace 2 horas', archivo: 'ensayo_garcia.pdf' },
    { id: 2, nombre: 'Martinez, Elena', estado: 'PENDIENTE', tiempo: 'Sin actividad', archivo: null },
    { id: 3, nombre: 'Torres, Ricardo', estado: 'RETRASADO', tiempo: 'Retraso de 1 día', archivo: null },
    { id: 4, nombre: 'Zuniga, Maria', estado: 'REVISADO', tiempo: 'Nota: 9.8/10', archivo: 'tarea_historia.pdf' },
  ];

  const filtrados = estudiantes.filter(est => {
    const matchBusqueda = est.nombre.toLowerCase().includes(busqueda.toLowerCase());
    if (filtro === 'Todos') return matchBusqueda;
    if (filtro === 'Entregados') return matchBusqueda && (est.estado === 'ENTREGADO' || est.estado === 'REVISADO');
    if (filtro === 'Pendientes') return matchBusqueda && (est.estado === 'PENDIENTE' || est.estado === 'RETRASADO');
    return matchBusqueda;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={{flex: 1, marginLeft: 10}}>
            <Text style={[styles.headerTitle, { color: Colors.onSurface }]} numberOfLines={1}>
                {tareaNombre}
            </Text>
            <Text style={{fontSize: 10, color: Colors.primary}}>Seguimiento de Notas</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* GRÁFICA DE PROGRESO */}
        <View style={[styles.progressCard, { backgroundColor: Colors.surfaceContainerLow }]}>
          <View style={styles.chartWrapper}>
            <View style={[styles.circleOuter, { borderColor: Colors.primary }]}>
              <Text style={[styles.progressValue, { color: Colors.onSurface }]}>75%</Text>
              <Text style={[styles.progressLabel, { color: Colors.onSurfaceVariant }]}>ENTREGA</Text>
            </View>
            <View style={styles.statsInfo}>
               <View style={{alignItems: 'center'}}>
                 <Text style={[styles.statValue, { color: Colors.secondary }]}>18</Text>
                 <Text style={styles.statLabel}>Entregados</Text>
               </View>
               <View style={styles.dividerV} />
               <View style={{alignItems: 'center'}}>
                 <Text style={[styles.statValue, { color: Colors.error }]}>06</Text>
                 <Text style={styles.statLabel}>Pendientes</Text>
               </View>
            </View>
          </View>
        </View>

        {/* BUSCADOR Y FILTROS */}
        <View style={[styles.searchBar, { backgroundColor: Colors.surfaceContainerLow, borderColor: Colors.outlineVariant }]}>
          <Ionicons name="search" size={18} color={Colors.onSurfaceVariant} />
          <TextInput 
            placeholder="Buscar estudiante..." 
            placeholderTextColor="#666"
            style={[styles.searchInput, { color: Colors.onSurface }]} 
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        <View style={styles.filterContainer}>
          {['Todos', 'Entregados', 'Pendientes'].map((item) => (
            <TouchableOpacity 
              key={item} 
              style={[
                styles.chip, 
                { backgroundColor: Colors.surfaceContainerLow, borderColor: Colors.outlineVariant },
                filtro === item && { backgroundColor: Colors.primary, borderColor: Colors.primary }
              ]}
              onPress={() => setFiltro(item)}
            >
              <Text style={[
                styles.chipText, 
                { color: Colors.onSurfaceVariant },
                filtro === item && { color: Colors.onPrimary, fontWeight: 'bold' }
              ]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LISTA */}
        <View style={styles.listContainer}>
          {filtrados.map((est) => (
            <View key={est.id} style={[styles.card, { backgroundColor: Colors.surfaceContainerLow }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.avatar, { backgroundColor: Colors.surfaceContainerHighest }]}>
                        <Text style={{ color: Colors.primary }}>{est.nombre[0]}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.studentName, { color: Colors.onSurface }]}>{est.nombre}</Text>
                        <Text style={[styles.studentTime, { color: Colors.onSurfaceVariant }]}>{est.tiempo}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: est.estado === 'PENDIENTE' ? Colors.error + '22' : Colors.primary + '22' }]}>
                        <Text style={[styles.statusText, { color: est.estado === 'PENDIENTE' ? Colors.error : Colors.primary }]}>{est.estado}</Text>
                    </View>
                </View>
                
                <TouchableOpacity style={[styles.gradeBtn, { backgroundColor: Colors.primary }]}>
                    <Text style={{ color: Colors.onPrimary, fontWeight: 'bold', fontSize: 12 }}>
                        {est.estado === 'REVISADO' ? 'Ver Calificación' : 'Calificar Tarea'}
                    </Text>
                </TouchableOpacity>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, elevation: 4 },
  backBtn: { backgroundColor: '#FFF', borderRadius: 10, padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  progressCard: { margin: 20, borderRadius: 24, padding: 20 },
  chartWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  circleOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, justifyContent: 'center', alignItems: 'center' },
  progressValue: { fontSize: 18, fontWeight: '800' },
  progressLabel: { fontSize: 7, fontWeight: 'bold' },
  statsInfo: { flexDirection: 'row', gap: 15 },
  dividerV: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#999' },
  searchBar: { flexDirection: 'row', marginHorizontal: 20, padding: 10, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14 },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 15 },
  chip: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 15, marginRight: 8, borderWidth: 1 },
  chipText: { fontSize: 12 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { borderRadius: 16, padding: 15, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 35, height: 35, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  studentName: { fontWeight: 'bold', fontSize: 13 },
  studentTime: { fontSize: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 8, fontWeight: 'bold' },
  gradeBtn: { marginTop: 12, paddingVertical: 8, borderRadius: 8, alignItems: 'center' }
});