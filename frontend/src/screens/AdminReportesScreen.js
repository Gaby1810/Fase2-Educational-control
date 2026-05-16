// ===============================
// AdminReportesScreen.js
// Reportes institucionales para el Administrador
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
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { get } from '../services/api';

const NAVY = '#0B2C74';
const TEAL = '#14B8A6';
const LIGHT_BG = '#F5F6FA';  // ✅ FIX 1: faltaba esta constante
const BAR_MAX_H = 130;        // ✅ FIX 2: movida aquí arriba (fuera de la función)
const BAR_COLORS = ['#14B8A6','#F59E0B','#EF4444','#8B5CF6','#3B82F6','#EC4899','#10B981']; // ✅ FIX 3: solo una declaración
const { width: SCREEN_W } = Dimensions.get('window');

export default function AdminReportesScreen({ navigation }) {

  const [datos, setDatos]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await get('/admin/reportes');
      setDatos(data);
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const onRefresh = () => { setRefreshing(true); cargar(); };

  const maxEstudiantes = datos?.estudiantesPorGrado?.length
    ? Math.max(...datos.estudiantesPorGrado.map(g => g.total), 1)
    : 1;

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={cargar}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 30 }}
        >

          {/* ── ASISTENCIA GENERAL ── */}
          <View style={styles.asistCard}>
            <Text style={styles.asistSub}>RENDIMIENTO INSTITUCIONAL</Text>
            <Text style={styles.asistTitle}>Asistencia General</Text>

            <View style={styles.asistRow}>
              <Text style={styles.asistPct}>{datos?.asistenciaGeneral ?? 0}%</Text>
              <View style={styles.asistBadge}>
                <Ionicons name="trending-up" size={13} color="#16A34A" />
                <Text style={styles.asistBadgeTxt}>+2.4%</Text>
                <Text style={styles.asistBadgeSub}>vs. mes anterior</Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${datos?.asistenciaGeneral ?? 0}%` },
                ]}
              />
            </View>
          </View>

          {/* ── STAT CARDS ── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="school-outline" size={24} color={NAVY} />
              <Text style={styles.statLabel}>Promedio Sistema</Text>
              <Text style={styles.statValue}>{datos?.promedioSistema ?? '0.0'} / 10</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={24} color={NAVY} />
              <Text style={styles.statLabel}>Total Alumnos</Text>
              <Text style={styles.statValue}>{(datos?.totalAlumnos ?? 0).toLocaleString()}</Text>
            </View>
          </View>

          {/* ── GRÁFICO DE BARRAS ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estudiantes por Grado</Text>
            <Text style={styles.sectionSub}>Distribución demográfica actual</Text>

            {(datos?.estudiantesPorGrado ?? []).length === 0 ? (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={46} color="#ddd" />
                <Text style={styles.emptyTxt}>Sin datos de grado disponibles</Text>
              </View>
            ) : (
              <View style={styles.chart}>
                <View style={styles.yAxis}>
                  {[maxEstudiantes, Math.round(maxEstudiantes * 0.75), Math.round(maxEstudiantes * 0.5), Math.round(maxEstudiantes * 0.25), 0].map((v, i) => (
                    <Text key={i} style={styles.yLabel}>{v}</Text>
                  ))}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.barsContainer}>
                    {datos.estudiantesPorGrado.map((g, i) => {
                      const h = Math.max(
                        Math.round((g.total / maxEstudiantes) * BAR_MAX_H),
                        4
                      );
                      const color = BAR_COLORS[i % BAR_COLORS.length];
                      return (
                        <View key={i} style={styles.barWrap}>
                          <View style={[styles.bar, { height: h, backgroundColor: color }]} />
                          <Text style={styles.barLabel}>{g.grado ?? '?'}º</Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>

          {/* ── CLASES POR GRADO ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Clases por Grado</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AdminClases')}>
                <Text style={styles.verTodas}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            {(datos?.clasesPorGrado ?? []).length === 0 ? (
              <Text style={styles.emptyTxt}>Sin clases registradas</Text>
            ) : (
              datos.clasesPorGrado.map((g, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.gradoItem}
                  onPress={() => navigation.navigate('AdminClases')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.gradoDot, { backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.gradoNombre}>{g.grado}º Grado</Text>
                    <Text style={styles.gradoSub}>{g.total_clases} clases activas</Text>
                  </View>
                  <View style={styles.gradoCount}>
                    <Text style={styles.gradoCountTxt}>{g.total_clases}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#bbb" />
                </TouchableOpacity>
              ))
            )}
          </View>

        </ScrollView>
      )}

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <NavItem icon="home-outline"   label="Inicio"   onPress={() => navigation.navigate('AdminDashboard')} />
        <NavItem icon="book-outline"   label="Clases"   onPress={() => navigation.navigate('AdminClases')} />
        <NavItem icon="people-outline" label="Usuarios" onPress={() => navigation.navigate('AdminUsuarios')} />
        <NavItem icon="bar-chart"      label="Reportes" active />
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
  container: { flex: 1, backgroundColor: LIGHT_BG },
  header: {
    height: 60, backgroundColor: NAVY,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
  },
  asistCard: {
    margin: 16, backgroundColor: '#fff',
    borderRadius: 16, padding: 20, elevation: 2,
  },
  asistSub:      { fontSize: 10, color: '#aaa', fontWeight: '600', letterSpacing: 0.5 },
  asistTitle:    { fontSize: 20, fontWeight: '800', color: '#111', marginTop: 2 },
  asistRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 14 },
  asistPct:      { fontSize: 42, fontWeight: '900', color: NAVY },
  asistBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  asistBadgeTxt: { fontSize: 13, color: '#16A34A', fontWeight: '700' },
  asistBadgeSub: { fontSize: 11, color: '#888' },
  progressBar:   { height: 8, backgroundColor: '#eee', borderRadius: 6, marginTop: 14, overflow: 'hidden' },
  progressFill:  { height: 8, backgroundColor: NAVY, borderRadius: 6 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 4 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 16, alignItems: 'center', elevation: 2,
  },
  statLabel: { fontSize: 12, color: '#888', marginTop: 6, textAlign: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: '#111', marginTop: 4 },
  section:          { paddingHorizontal: 16, marginTop: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle:     { fontSize: 16, fontWeight: '700', color: '#111' },
  sectionSub:       { fontSize: 12, color: '#aaa', marginBottom: 14 },
  verTodas:         { fontSize: 13, color: NAVY, fontWeight: '600' },
  chart:         { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, minHeight: BAR_MAX_H + 30 },
  yAxis:         { justifyContent: 'space-between', height: BAR_MAX_H + 20, marginRight: 8, alignItems: 'flex-end' },
  yLabel:        { fontSize: 10, color: '#bbb' },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, paddingBottom: 4 },
  barWrap:       { alignItems: 'center' },
  bar:           { width: 36, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barLabel:      { fontSize: 11, color: '#888', marginTop: 6 },
  emptyChart:    { alignItems: 'center', paddingVertical: 30 },
  emptyTxt:      { color: '#bbb', fontSize: 13, marginTop: 8 },
  gradoItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    padding: 14, marginBottom: 8, elevation: 1, gap: 10,
  },
  gradoDot:      { width: 4, height: 36, borderRadius: 4 },
  gradoNombre:   { fontSize: 14, fontWeight: '600', color: '#111' },
  gradoSub:      { fontSize: 12, color: '#aaa', marginTop: 2 },
  gradoCount:    {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
  },
  gradoCountTxt: { fontSize: 14, fontWeight: '700', color: '#333' },
  bottomNav: {
    height: 70, backgroundColor: '#fff',
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', borderTopWidth: 1, borderColor: '#eee',
  },
  navItem:  { alignItems: 'center' },
  navLabel: { fontSize: 11, color: '#888', marginTop: 3 },
});