// ===============================
// AdminClasesScreen.js
// Lista de todas las clases para el Administrador
// ===============================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { get, del } from '../services/api';

import { Colors } from '../constants/colors';

// const NAVY = '#0B2C74';
// const LIGHT_BG = '#F5F6FA';

// Color por grado (cíclico)
const GRADO_COLORS = ['#4F46E5','#0891B2','#059669','#D97706','#DC2626','#7C3AED','#DB2777'];
const gradoColor = (grado = '') => {
  const num = parseInt(grado) || 0;
  return GRADO_COLORS[num % GRADO_COLORS.length];
};

export default function AdminClasesScreen({ navigation }) {

  const [clases, setClases]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await get('/admin/clases');
      setClases(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const onRefresh = () => { setRefreshing(true); cargar(); };

  const confirmarEliminar = (c) => {
    Alert.alert(
      'Eliminar clase',
      `¿Eliminar la clase "${c.nombre}"? Se borrarán todos sus datos asociados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await del(`/admin/clases/${c.id}`);
              cargar();
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={cargar}>
          <Ionicons name="refresh" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* TÍTULO */}
      <View style={styles.titleRow}>
        <Text style={[styles.pageTitle, { color: Colors.onSurfaceVariant }]}>LISTA DE CLASES ({clases.length})</Text>
        <View style={[styles.cicloTag, { backgroundColor: Colors.surfaceContainerHighest }]}>
          <Text style={[styles.cicloTxt, { color: Colors.primary }]}>Ciclo 2026</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
        >
          {clases.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="book-open-outline" size={54} color={Colors.outline} />
              <Text style={[styles.emptyTxt, { color: Colors.onSurfaceVariant }]}>No hay clases registradas</Text>
            </View>
          ) : (
            clases.map(c => (
              <ClaseCard
                key={c.id}
                clase={c}
                onEliminar={() => confirmarEliminar(c)}
                onVerListado={() => navigation.navigate('Asistencia', { claseId: c.id, nombreClase: c.nombre })}
                gradoColor={gradoColor(c.grado)}
              />
            ))
          )}

          <Text style={[styles.finLista, { color: Colors.outlineVariant }]}>Fin de la lista de gestión</Text>
        </ScrollView>
      )}

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: Colors.surfaceContainerLowest, borderColor: Colors.outlineVariant }]}>
        <NavItem icon="home-outline"      label="Inicio"   onPress={() => navigation.navigate('AdminDashboard')} />
        <NavItem icon="book"              label="Clases"   active />
        <NavItem icon="people-outline"    label="Usuarios" onPress={() => navigation.navigate('AdminUsuarios')} />
        <NavItem icon="bar-chart-outline" label="Reportes" onPress={() => navigation.navigate('AdminReportes')} />
      </View>

    </SafeAreaView>
  );
}

function ClaseCard({ clase, onEliminar, onVerListado, gradoColor }) {
  const avatares = ['👤', '👤', '👤'];

  return (
    <View style={[styles.card, { backgroundColor: Colors.surfaceContainerLow }]}>

      {/* Nombre + iconos de acción */}
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardNombre, { color: Colors.onSurface }]}>{clase.nombre}</Text>
          <View style={styles.asignaturaRow}>
            <MaterialCommunityIcons name="book" size={14} color={Colors.primary} />
            <Text style={[styles.asignatura, { color: Colors.primary }]}>{clase.nombre}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="pencil-outline" size={18} color={Colors.outline} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onEliminar}>
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Meta-info */}
      <View style={styles.metaGrid}>
        <MetaItem label="DOCENTE" value={clase.docente ?? 'Sin asignar'} icon="person-outline" />
        <MetaItem label="GRADO"   value={clase.grado ?? '–'}             icon="school-outline" />
        <MetaItem label="CÓDIGO"  value={`#${clase.codigo_clase}`}        icon="pricetag-outline" highlight />
        <MetaItem label="ESTATUS" value="Activa"                          icon={null} status />
      </View>

      {/* Footer */}
      <View style={[styles.cardFooter, { borderColor: Colors.outlineVariant }]}>
        <View style={styles.avatarRow}>
          {avatares.map((a, i) => (
            <View key={i} style={[styles.avatarMini, { backgroundColor: Colors.surfaceContainerHighest, borderColor: Colors.surfaceContainerLow, marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i }]}>
              <Text style={{ fontSize: 14 }}>{a}</Text>
            </View>
          ))}
          <Text style={[styles.totalEst, { color: Colors.onSurfaceVariant }]}>
            +{clase.total_estudiantes ?? 0} estudiantes
          </Text>
        </View>
        <TouchableOpacity style={[styles.verListadoBtn, { borderColor: Colors.outline }]} onPress={onVerListado}>
          <Text style={[styles.verListadoTxt, { color: Colors.onSurface }]}>Ver Asistencia</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

function MetaItem({ label, value, icon, highlight, status }) {
  return (
    <View style={styles.metaItem}>
      <Text style={[styles.metaLabel, { color: Colors.onSurfaceVariant }]}>{label}</Text>
      <View style={styles.metaValueRow}>
        {icon && <Ionicons name={icon} size={13} color={highlight ? Colors.primary : Colors.outline} style={{ marginRight: 3 }} />}
        {status ? (
          <View style={[styles.statusBadge, { backgroundColor: Colors.secondary + '22' }]}>
            <Text style={[styles.statusTxt, { color: Colors.secondary }]}>{value}</Text>
          </View>
        ) : (
          <Text style={[styles.metaValue, { color: Colors.onSurface }, highlight && { color: Colors.primary, fontWeight: '700' }]}>
            {value}
          </Text>
        )}
      </View>
    </View>
  );
}

function NavItem({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={active ? Colors.primary : Colors.outline} />
      <Text style={[styles.navLabel, { color: Colors.outline }, active && { color: Colors.primary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
  },

  titleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  pageTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  cicloTag:  { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  cicloTxt:  { fontSize: 12, fontWeight: '600' },

  empty:    { alignItems: 'center', marginTop: 60 },
  emptyTxt: { marginTop: 10, fontSize: 14 },
  finLista: { textAlign: 'center', fontSize: 12, marginTop: 16 },

  // Card
  card: {
    borderRadius: 14,
    marginBottom: 16, padding: 16, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardNombre: { fontSize: 17, fontWeight: '700' },
  asignaturaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  asignatura: { fontSize: 13, color: Colors.primary, marginLeft: 4 },
  iconBtn: { padding: 6 },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metaItem: { width: '46%' },
  metaLabel: { fontSize: 10, color: '#aaa', fontWeight: '600', marginBottom: 3 },
  metaValueRow: { flexDirection: 'row', alignItems: 'center' },
  metaValue: { fontSize: 13, color: '#333' },
  statusBadge: { backgroundColor: '#E6FAF0', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20 },
  statusTxt: { color: '#1B7A3E', fontSize: 12, fontWeight: '600' },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10, borderTopWidth: 1, borderColor: '#f0f0f0',
  },
  avatarRow:  { flexDirection: 'row', alignItems: 'center' },
  avatarMini: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#eee', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  totalEst: { fontSize: 12, color: '#777', marginLeft: 6 },
  verListadoBtn: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  verListadoTxt: { fontSize: 13, color: '#333', fontWeight: '600' },

  bottomNav: {
    height: 70, backgroundColor: '#fff',
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', borderTopWidth: 1, borderColor: '#eee',
  },
  navItem:  { alignItems: 'center' },
  navLabel: { fontSize: 11, color: '#888', marginTop: 3 },
});