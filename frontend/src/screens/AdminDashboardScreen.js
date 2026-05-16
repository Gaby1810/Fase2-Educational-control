// ===============================
// AdminDashboardScreen.js
// Dashboard principal del Administrador
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
import { get } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const NAVY = '#0B2C74';
const LIGHT_BG = '#F5F6FA';

export default function AdminDashboardScreen({ navigation }) {

  const { logout, usuario } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargarStats = useCallback(async () => {
    try {
      const data = await get('/admin/stats');
      setStats(data);
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargarStats(); }, [cargarStats]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarStats();
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, salir',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
          },
        },
      ]
    );
  };

  // Tarjetas de stats
  const statCards = stats
    ? [
        {
          label: 'Reportes',
          value: null,
          icon: 'bar-chart',
          color: '#E8EEFF',
          iconColor: NAVY,
          onPress: () => navigation.navigate('AdminReportes'),
        },
        {
          label: 'Total de docentes',
          value: stats.totalDocentes,
          icon: 'school',
          color: '#E0FAF5',
          iconColor: '#00897B',
          onPress: () => navigation.navigate('AdminUsuarios', { filtroInicial: 'docente' }),
        },
        {
          label: 'Total de estudiantes',
          value: stats.totalEstudiantes,
          icon: 'people',
          color: '#FFEDE8',
          iconColor: '#E64A19',
          onPress: () => navigation.navigate('AdminUsuarios', { filtroInicial: 'estudiante' }),
        },
        {
          label: 'Total de clases',
          value: stats.totalClases,
          icon: 'book',
          color: '#FFF8E1',
          iconColor: '#F57F17',
          onPress: () => navigation.navigate('AdminClases'),
        },
      ]
    : [];

  // Icono por tipo de actividad
  const iconoActividad = (tipo, subtipo) => {
    if (tipo === 'usuario_creado') {
      if (subtipo === 'docente')       return { name: 'person-add', color: '#00897B' };
      if (subtipo === 'administrador') return { name: 'shield',     color: NAVY };
      return { name: 'person-add', color: '#E64A19' };
    }
    return { name: 'add-circle', color: '#888' };
  };

  const labelActividad = (item) => {
    if (item.tipo === 'usuario_creado') return 'Usuario creado';
    return 'Actividad';
  };

  const tiempoRelativo = (fechaStr) => {
    if (!fechaStr) return '';
    const diff = Date.now() - new Date(fechaStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60)  return `Hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs  < 24)  return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)}d`;
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        {/* SALUDO */}
        <View style={styles.greeting}>
          <Text style={styles.greetTitle}>Hola, Administrador 👋</Text>
          <Text style={styles.greetSub}>Aquí tienes un resumen del sistema hoy.</Text>
        </View>

        {/* STATS */}
        {loading ? (
          <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              {statCards.map((card, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.statCard, { backgroundColor: card.color }]}
                  onPress={card.onPress}
                  activeOpacity={0.8}
                >
                  <Ionicons name={card.icon} size={28} color={card.iconColor} />
                  <Text style={styles.statLabel}>{card.label}</Text>
                  {card.value !== null && (
                    <Text style={[styles.statValue, { color: card.iconColor }]}>
                      {card.value?.toLocaleString() ?? '–'}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* ACTIVIDAD RECIENTE */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Actividad reciente</Text>
                <TouchableOpacity onPress={() => navigation.navigate('AdminUsuarios')}>
                  <Text style={styles.verTodo}>VER TODO</Text>
                </TouchableOpacity>
              </View>

              {(stats?.actividadReciente ?? []).length === 0 ? (
                <Text style={styles.emptyText}>Sin actividad reciente</Text>
              ) : (
                (stats?.actividadReciente ?? []).map((item, idx) => {
                  const icono = iconoActividad(item.tipo, item.subtitulo);
                  return (
                    <View key={idx} style={styles.actItem}>
                      <View style={[styles.actIcon, { backgroundColor: icono.color + '22' }]}>
                        <Ionicons name={icono.name} size={20} color={icono.color} />
                      </View>
                      <View style={styles.actContent}>
                        <Text style={styles.actTitle}>{labelActividad(item)}</Text>
                        <Text style={styles.actSub}>
                          {item.titulo} • {item.subtitulo}
                        </Text>
                      </View>
                      <Text style={styles.actTime}>{tiempoRelativo(item.fecha)}</Text>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

      </ScrollView>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <NavItem icon="home" label="Inicio" active onPress={() => {}} />
        <NavItem icon="book-outline" label="Clases" onPress={() => navigation.navigate('AdminClases')} />
        <NavItem icon="people-outline" label="Usuarios" onPress={() => navigation.navigate('AdminUsuarios')} />
        <NavItem icon="bar-chart-outline" label="Reportes" onPress={() => navigation.navigate('AdminReportes')} />
      </View>

    </SafeAreaView>
  );
}

function NavItem({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={active ? NAVY : '#888'} />
      <Text style={[styles.navLabel, active && { color: NAVY }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: LIGHT_BG },
  header: {
    height: 60,
    backgroundColor: NAVY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    gap: 10,
  },
  headerBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  greeting: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8 },
  greetTitle: { fontSize: 22, fontWeight: '700', color: '#111' },
  greetSub:   { fontSize: 13, color: '#666', marginTop: 2 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
    marginTop: 10,
  },
  statCard: {
    width: '46%',
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  statLabel: { fontSize: 13, color: '#444', marginTop: 8, fontWeight: '500' },
  statValue: { fontSize: 26, fontWeight: '800', marginTop: 4 },

  section:       { paddingHorizontal: 20, marginTop: 24, marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: '#111' },
  verTodo:       { fontSize: 12, color: NAVY, fontWeight: '600' },
  emptyText:     { color: '#999', textAlign: 'center', marginTop: 10 },

  actItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  actIcon:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  actContent: { flex: 1 },
  actTitle:   { fontSize: 14, fontWeight: '600', color: '#111' },
  actSub:     { fontSize: 12, color: '#777', marginTop: 2 },
  actTime:    { fontSize: 11, color: '#aaa', marginLeft: 8 },

  bottomNav: {
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  navItem:  { alignItems: 'center' },
  navLabel: { fontSize: 11, color: '#888', marginTop: 3 },
});