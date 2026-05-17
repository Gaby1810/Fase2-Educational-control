import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import { get, put } from '../services/api';

const mesesNombre = {
  1: 'Ene',
  2: 'Feb',
  3: 'Mar',
  4: 'Abr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Ago',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dic'
};

export default function PerfilScreen({ navigation }) {
  const { usuario } = useAuth();
  const anioActual = new Date().getFullYear();

  const [loading, setLoading] = useState(true);
  const [reporte, setReporte] = useState(null);
  
  const [editMode, setEditMode] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ nombre: '', telefono: '' });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setForm({ nombre: usuario?.nombre || '', telefono: usuario?.telefono || '' });
      cargarReporte();
    });
    return unsubscribe;
  }, [navigation, usuario]);

  const cargarReporte = async () => {
    try {
      setLoading(true);
      const data = await get(`/asistencia/reporte-anual?anio=${anioActual}`);
      setReporte(data);
    } catch (error) {
      console.log('Error reporte asistencia:', error.message);
      setReporte(null);
    } finally {
      setLoading(false);
    }
  };

  const resumen = reporte?.resumen || {
    total: 0,
    presentes: 0,
    ausentes: 0,
    tardes: 0,
    porcentajeAsistencia: 0
  };

  const materias = Array.isArray(reporte?.materias) ? reporte.materias : [];
  const meses = Array.isArray(reporte?.meses) ? reporte.meses : [];
  const porcentaje = Number(resumen.porcentajeAsistencia || 0);

  const porcentajeMateria = (materia) => {
    const total = Number(materia.total || 0);
    if (!total) return 0;
    return Number(((Number(materia.presentes || 0) / total) * 100).toFixed(1));
  };

  const handleGuardarPerfil = async () => {
    if (!form.nombre.trim()) return;
    try {
      setGuardando(true);
      const res = await put('/auth/perfil', { nombre: form.nombre, telefono: form.telefono });
      usuario.nombre = form.nombre;
      usuario.telefono = form.telefono;
      setEditMode(false);
    } catch (e) {
      console.log('Error', e.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={[styles.headerTitle, { color: Colors.onSurface }]}>
            Perfil
          </Text>
          <Text style={[styles.headerSub, { color: Colors.onSurfaceVariant }]}>
            Reporte anual de asistencia
          </Text>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: Colors.surfaceContainerHigh }]}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
            <Text style={[styles.avatarText, { color: Colors.onPrimary }]}>
              {(usuario?.nombre || '?')[0].toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1, marginLeft: 14 }}>
            {!editMode ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.name, { color: Colors.onSurface, flex: 1 }]} numberOfLines={1}>
                    {usuario?.nombre || 'Estudiante'}
                  </Text>
                  <TouchableOpacity onPress={() => setEditMode(true)} style={{ padding: 5 }}>
                    <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.email, { color: Colors.onSurfaceVariant }]} numberOfLines={1}>
                  {usuario?.correo || 'Sin correo'}
                </Text>
                {usuario?.telefono && (
                  <Text style={[styles.email, { color: Colors.onSurfaceVariant }]} numberOfLines={1}>
                    {usuario.telefono}
                  </Text>
                )}
                <Text style={[styles.meta, { color: Colors.primary }]}>
                  {usuario?.rol === 'docente' ? 'Docente' : `${usuario?.grado || 'Grado'} - Seccion ${usuario?.seccion || '-'} ${usuario?.turno ? `- Turno ${usuario.turno}` : ''}`} - {anioActual}
                </Text>
              </>
            ) : (
              <View style={{ gap: 10 }}>
                <TextInput
                  style={[styles.input, { color: Colors.onSurface }]}
                  value={form.nombre}
                  onChangeText={(t) => setForm({ ...form, nombre: t })}
                  placeholder="Nombre completo"
                  placeholderTextColor={Colors.onSurfaceVariant}
                />
                <TextInput
                  style={[styles.input, { color: Colors.onSurface }]}
                  value={form.telefono}
                  onChangeText={(t) => setForm({ ...form, telefono: t })}
                  placeholder="Teléfono"
                  placeholderTextColor={Colors.onSurfaceVariant}
                  keyboardType="phone-pad"
                />
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 5 }}>
                  <TouchableOpacity 
                    style={[styles.editBtn, { backgroundColor: Colors.surfaceContainerHighest, flex: 1 }]} 
                    onPress={() => setEditMode(false)}
                  >
                    <Text style={{ color: Colors.onSurface, fontWeight: 'bold' }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.editBtn, { backgroundColor: Colors.primary, flex: 1 }]} 
                    onPress={handleGuardarPerfil}
                    disabled={guardando}
                  >
                    {guardando ? <ActivityIndicator size="small" color={Colors.onPrimary} /> : <Text style={{ color: Colors.onPrimary, fontWeight: 'bold' }}>Guardar</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {!loading && (
          <>
            <View style={[styles.reportCard, { backgroundColor: Colors.surfaceContainerLow }]}>
              <View style={styles.reportHeader}>
                <View>
                  <Text style={[styles.sectionLabel, { color: Colors.onSurfaceVariant }]}>
                    ASISTENCIA DEL AÑIO
                  </Text>
                  <Text style={[styles.bigPercent, { color: Colors.onSurface }]}>
                    {porcentaje}%
                  </Text>
                </View>

                <View style={[styles.circleIcon, { backgroundColor: Colors.primary + '22' }]}>
                  <MaterialCommunityIcons name="calendar-check" size={32} color={Colors.primary} />
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(porcentaje, 100)}%`,
                      backgroundColor: porcentaje >= 80 ? Colors.secondary : porcentaje >= 60 ? Colors.tertiary : Colors.error
                    }
                  ]}
                />
              </View>

              <View style={styles.summaryRow}>
                <SummaryItem label="Presente" value={resumen.presentes} color={Colors.secondary} />
                <SummaryItem label="Ausente" value={resumen.ausentes} color={Colors.error} />
                <SummaryItem label="Tarde" value={resumen.tardes} color={Colors.tertiary} />
                <SummaryItem label="Total" value={resumen.total} color={Colors.primary} />
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: Colors.onSurfaceVariant }]}>
              POR MATERIA
            </Text>

            {materias.length === 0 && (
              <View style={[styles.emptyCard, { backgroundColor: Colors.surfaceContainerLow }]}>
                <MaterialCommunityIcons name="calendar-remove-outline" size={42} color={Colors.outline} />
                <Text style={[styles.emptyText, { color: Colors.onSurfaceVariant }]}>
                  Aun no hay materias inscritas para mostrar asistencia.
                </Text>
              </View>
            )}

            {materias.map((materia) => {
              const p = porcentajeMateria(materia);
              return (
                <View key={materia.clase_id} style={[styles.subjectCard, { backgroundColor: Colors.surfaceContainerLow }]}>
                  <View style={styles.subjectHeader}>
                    <View style={[styles.subjectIcon, { backgroundColor: Colors.primary + '22' }]}>
                      <MaterialCommunityIcons name="book-open-page-variant" size={22} color={Colors.primary} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.subjectName, { color: Colors.onSurface }]} numberOfLines={1}>
                        {materia.materia}
                      </Text>
                      <Text style={[styles.subjectMeta, { color: Colors.onSurfaceVariant }]}>
                        {materia.total || 0} registros - {p}% presente
                      </Text>
                    </View>
                  </View>

                  <View style={styles.subjectStats}>
                    <MiniStat label="P" value={materia.presentes || 0} color={Colors.secondary} />
                    <MiniStat label="A" value={materia.ausentes || 0} color={Colors.error} />
                    <MiniStat label="T" value={materia.tardes || 0} color={Colors.tertiary} />
                  </View>
                </View>
              );
            })}

            {meses.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: Colors.onSurfaceVariant }]}>
                  RESUMEN MENSUAL
                </Text>

                <View style={[styles.monthsCard, { backgroundColor: Colors.surfaceContainerLow }]}>
                  {meses.map((mes) => (
                    <View key={mes.mes} style={styles.monthRow}>
                      <Text style={[styles.monthName, { color: Colors.onSurface }]}>
                        {mesesNombre[mes.mes] || mes.mes}
                      </Text>
                      <Text style={[styles.monthValue, { color: Colors.onSurfaceVariant }]}>
                        {mes.presentes || 0} P / {mes.ausentes || 0} A / {mes.tardes || 0} T
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const SummaryItem = ({ label, value, color }) => (
  <View style={styles.summaryItem}>
    <Text style={[styles.summaryValue, { color }]}>{value || 0}</Text>
    <Text style={[styles.summaryLabel, { color: Colors.onSurfaceVariant }]}>{label}</Text>
  </View>
);

const MiniStat = ({ label, value, color }) => (
  <View style={[styles.miniStat, { borderColor: color }]}>
    <Text style={[styles.miniLabel, { color }]}>{label}</Text>
    <Text style={[styles.miniValue, { color: Colors.onSurface }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: { fontSize: 17, fontWeight: 'bold' },
  headerSub: { fontSize: 11, marginTop: 2 },
  content: { padding: 20, paddingBottom: 34 },
  profileCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { fontSize: 24, fontWeight: '900' },
  name: { fontSize: 17, fontWeight: '900' },
  email: { fontSize: 12, marginTop: 2 },
  meta: { fontSize: 12, fontWeight: '800', marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  editBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingBox: { alignItems: 'center', marginTop: 40 },
  reportCard: { borderRadius: 20, padding: 18, marginBottom: 20 },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  bigPercent: { fontSize: 40, fontWeight: '900', marginTop: 4 },
  circleIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
    marginBottom: 18
  },
  progressFill: { height: '100%', borderRadius: 999 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  summaryItem: { width: '24%', alignItems: 'center' },
  summaryValue: { fontSize: 18, fontWeight: '900' },
  summaryLabel: { fontSize: 10, marginTop: 2 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 2
  },
  emptyCard: {
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 18
  },
  emptyText: { marginTop: 10, textAlign: 'center', fontSize: 13 },
  subjectCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  subjectHeader: { flexDirection: 'row', alignItems: 'center' },
  subjectIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  subjectName: { fontSize: 15, fontWeight: '900' },
  subjectMeta: { fontSize: 12, marginTop: 3 },
  subjectStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14
  },
  miniStat: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center'
  },
  miniLabel: { fontSize: 11, fontWeight: '900' },
  miniValue: { fontSize: 16, fontWeight: '900', marginTop: 2 },
  monthsCard: { borderRadius: 18, padding: 14 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)'
  },
  monthName: { fontSize: 13, fontWeight: '900' },
  monthValue: { fontSize: 12, fontWeight: '700' }
});
