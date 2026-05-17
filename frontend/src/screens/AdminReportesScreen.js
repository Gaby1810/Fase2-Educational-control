// ===============================
// AdminReportesScreen.js
// Reportes institucionales para el Administrador
// ===============================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import useFetch from '../hooks/useFetch';

// const NAVY = '#0B2C74';
// const TEAL = '#14B8A6';
// const LIGHT_BG = '#F5F6FA';
const BAR_MAX_H = 130;
const BAR_COLORS = ['#14B8A6','#F59E0B','#EF4444','#8B5CF6','#3B82F6','#EC4899','#10B981']; // ✅ FIX 3: solo una declaración
const { width: SCREEN_W } = Dimensions.get('window');

export default function AdminReportesScreen({ navigation }) {

  // Toda la lógica de carga/recarga vive en el hook reutilizable
  const {
    data: datos,
    loading,
    refreshing,
    refetch: cargar,
    refresh: onRefresh,
  } = useFetch('/admin/reportes');

  const maxEstudiantes = datos?.estudiantesPorGrado?.length
    ? Math.max(...datos.estudiantesPorGrado.map(g => g.total), 1)
    : 1;

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

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 30 }}
        >

          {/* ── ASISTENCIA GENERAL ── */}
          <View style={[styles.asistCard, { backgroundColor: Colors.surfaceContainerLow }]}>
            <Text style={[styles.asistSub, { color: Colors.onSurfaceVariant }]}>RENDIMIENTO INSTITUCIONAL</Text>
            <Text style={[styles.asistTitle, { color: Colors.onSurface }]}>Asistencia General</Text>

            <View style={styles.asistRow}>
              <Text style={[styles.asistPct, { color: Colors.primary }]}>{datos?.asistenciaGeneral ?? 0}%</Text>
              <View style={styles.asistBadge}>
                <Ionicons name="trending-up" size={13} color="#16A34A" />
                <Text style={styles.asistBadgeTxt}>+2.4%</Text>
                <Text style={[styles.asistBadgeSub, { color: Colors.onSurfaceVariant }]}>vs. mes anterior</Text>
              </View>
            </View>

            <View style={[styles.progressBar, { backgroundColor: Colors.surfaceContainerHighest }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${datos?.asistenciaGeneral ?? 0}%`, backgroundColor: Colors.primary },
                ]}
              />
            </View>
          </View>

          {/* ── STAT CARDS ── */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: Colors.surfaceContainerLow }]}>
              <Ionicons name="school-outline" size={24} color={Colors.primary} />
              <Text style={[styles.statLabel, { color: Colors.onSurfaceVariant }]}>Promedio Sistema</Text>
              <Text style={[styles.statValue, { color: Colors.onSurface }]}>{datos?.promedioSistema ?? '0.0'} / 10</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors.surfaceContainerLow }]}>
              <Ionicons name="people-outline" size={24} color={Colors.primary} />
              <Text style={[styles.statLabel, { color: Colors.onSurfaceVariant }]}>Total Alumnos</Text>
              <Text style={[styles.statValue, { color: Colors.onSurface }]}>{(datos?.totalAlumnos ?? 0).toLocaleString()}</Text>
            </View>
          </View>

          {/* ── GRÁFICO DE BARRAS ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: Colors.onSurface }]}>Estudiantes por Grado</Text>
            <Text style={[styles.sectionSub, { color: Colors.onSurfaceVariant }]}>Distribución demográfica actual</Text>

            {(datos?.estudiantesPorGrado ?? []).length === 0 ? (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={46} color={Colors.outline} />
                <Text style={[styles.emptyTxt, { color: Colors.onSurfaceVariant }]}>Sin datos de grado disponibles</Text>
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
                          <Text style={[styles.barLabel, { color: Colors.onSurfaceVariant }]}>{g.grado ?? '?'}º</Text>
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
              <Text style={[styles.sectionTitle, { color: Colors.onSurface }]}>Clases por Grado</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AdminClases')}>
                <Text style={[styles.verTodas, { color: Colors.primary }]}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            {(datos?.clasesPorGrado ?? []).length === 0 ? (
              <Text style={[styles.emptyTxt, { color: Colors.onSurfaceVariant }]}>Sin clases registradas</Text>
            ) : (
              datos.clasesPorGrado.map((g, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.gradoItem, { backgroundColor: Colors.surfaceContainerLow }]}
                  onPress={() => navigation.navigate('AdminClases')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.gradoDot, { backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.gradoNombre, { color: Colors.onSurface }]}>{g.grado}º Grado</Text>
                    <Text style={[styles.gradoSub, { color: Colors.onSurfaceVariant }]}>{g.total_clases} clases activas</Text>
                  </View>
                  <View style={[styles.gradoCount, { backgroundColor: Colors.surfaceContainerHighest }]}>
                    <Text style={[styles.gradoCountTxt, { color: Colors.onSurface }]}>{g.total_clases}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.outline} />
                </TouchableOpacity>
              ))
            )}
          </View>

        </ScrollView>
      )}

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { backgroundColor: Colors.surfaceContainerHighest, borderColor: Colors.outlineVariant }]}>
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
  asistCard: {
    margin: 16,
    borderRadius: 16, padding: 20, elevation: 2,
  },
  asistSub:      { fontSize: 10, fontWeight: '600', letterSpacing: 0.5 },
  asistTitle:    { fontSize: 20, fontWeight: '800', marginTop: 2 },
  asistRow:      { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 14 },
  asistPct:      { fontSize: 42, fontWeight: '900' },
  asistBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  asistBadgeTxt: { fontSize: 13, color: '#16A34A', fontWeight: '700' },
  asistBadgeSub: { fontSize: 11 },
  progressBar:   { height: 8, borderRadius: 6, marginTop: 14, overflow: 'hidden' },
  progressFill:  { height: 8, borderRadius: 6 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 4 },
  statCard: {
    flex: 1, borderRadius: 14,
    padding: 16, alignItems: 'center', elevation: 2,
  },
  statLabel: { fontSize: 12, marginTop: 6, textAlign: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  section:          { paddingHorizontal: 16, marginTop: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle:     { fontSize: 16, fontWeight: '700' },
  sectionSub:       { fontSize: 12, marginBottom: 14 },
  verTodas:         { fontSize: 13, fontWeight: '600' },
  chart:         { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, minHeight: BAR_MAX_H + 30 },
  yAxis:         { justifyContent: 'space-between', height: BAR_MAX_H + 20, marginRight: 8, alignItems: 'flex-end' },
  yLabel:        { fontSize: 10, color: '#bbb' },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, paddingBottom: 4 },
  barWrap:       { alignItems: 'center' },
  bar:           { width: 36, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barLabel:      { fontSize: 11, marginTop: 6 },
  emptyChart:    { alignItems: 'center', paddingVertical: 30 },
  emptyTxt:      { fontSize: 13, marginTop: 8 },
  gradoItem: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12,
    padding: 14, marginBottom: 8, elevation: 1, gap: 10,
  },
  gradoDot:      { width: 4, height: 36, borderRadius: 4 },
  gradoNombre:   { fontSize: 14, fontWeight: '600' },
  gradoSub:      { fontSize: 12, marginTop: 2 },
  gradoCount:    {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  gradoCountTxt: { fontSize: 14, fontWeight: '700' },
  bottomNav: {
    height: 70,
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', borderTopWidth: 1,
  },
  navItem:  { alignItems: 'center' },
  navLabel: { fontSize: 11, marginTop: 3 },
});