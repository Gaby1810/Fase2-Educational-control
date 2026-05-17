import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
  Modal
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { get, post } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function AsistenciaScreen({ route, navigation }) {

  const [fechaActual, setFechaActual] = useState(new Date());

  const { claseId, nombreClase } = route?.params || {};
  const { usuario } = useAuth();
  
  const esDocente = usuario?.rol === 'docente';
  const esAdmin = usuario?.rol === 'administrador';
  const esDocenteOAdmin = esDocente || esAdmin;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estudiante: su historial de asistencia
  const [historial, setHistorial] = useState([]);

  // Docente/Admin: estudiantes inscritos + estado marcado por id
  const [estudiantes, setEstudiantes] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);

  // Modal de Historial
  const [modalVisible, setModalVisible] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
  const [historialEstudiante, setHistorialEstudiante] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // ===================================================
  // CARGAR DATOS
  // ===================================================
  useEffect(() => {
    if (!claseId) {
      setLoading(false);
      return;
    }
    cargar();
  }, [claseId, fechaActual]);

  const cargar = async () => {
    try {
      setLoading(true);
      if (esDocenteOAdmin) {
        // Cargar alumnos inscritos
        const lista = await get(`/clases/${claseId}/estudiantes`);
        setEstudiantes(Array.isArray(lista) ? lista : []);
        
        // Cargar asistencia previa para esta fecha específica
        const dateStr = fechaActual.toISOString().split('T')[0];
        const hist = await get(`/asistencia/clase/${claseId}?fecha=${dateStr}`);
        
        // Mapear historial al estado local
        const asist = {};
        if (Array.isArray(hist)) {
          hist.forEach(r => {
            if(r.estado === 'presente') asist[r.estudiante_id] = 'P';
            else if(r.estado === 'ausente') asist[r.estudiante_id] = 'A';
            else if(r.estado === 'tarde') asist[r.estudiante_id] = 'T';
          });
        }
        setAsistencia(asist);

      } else {
        // Si es estudiante
        const hist = await get(`/asistencia/clase/${claseId}`);
        setHistorial(Array.isArray(hist) ? hist : []);
      }
    } catch (e) {
      console.log('Error asistencia:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    cargar();
  };

  const esHoy = () => {
    const hoy = new Date();
    return fechaActual.getDate() === hoy.getDate() && 
           fechaActual.getMonth() === hoy.getMonth() && 
           fechaActual.getFullYear() === hoy.getFullYear();
  };

  const cambiarFecha = (dias) => {
    if (dias > 0 && esHoy()) return; // Prevenir fechas futuras
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    setFechaActual(nuevaFecha);
  };

  const cargarHistorial = async (estudiante) => {
    setEstudianteSeleccionado(estudiante);
    setModalVisible(true);
    setLoadingHistorial(true);
    try {
      const data = await get(`/asistencia/clase/${claseId}/estudiante/${estudiante.id}`);
      setHistorialEstudiante(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoadingHistorial(false);
    }
  };

  // ===================================================
  // DOCENTE: marcar y guardar
  // ===================================================
  const marcar = (estudianteId, estado) => {
    if (!esDocente) return; // Solo docente edita
    setAsistencia((prev) => ({ ...prev, [estudianteId]: estado }));
  };

  const totales = Object.values(asistencia).reduce(
    (acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    },
    { P: 0, A: 0, T: 0 }
  );

  const handleGuardar = async () => {
    if (!esDocente) return;
    if (estudiantes.length === 0) {
      Alert.alert('Sin estudiantes', 'No hay estudiantes inscritos en esta clase.');
      return;
    }
    if (Object.keys(asistencia).length < estudiantes.length) {
      Alert.alert('Incompleto', 'Marca la asistencia de todos los alumnos.');
      return;
    }

    try {
      setGuardando(true);
      const dateStr = fechaActual.toISOString().split('T')[0];

      await post('/asistencia/guardar', {
        clase_id: claseId,
        fecha: dateStr,
        datos: asistencia
      });

      setMostrarExito(true);
      setTimeout(() => {
        setMostrarExito(false);
      }, 2200);

    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setGuardando(false);
    }
  };

  // ===================================================
  // ESTUDIANTE: resumen
  // ===================================================
  const resumenEstudiante = historial.reduce(
    (acc, r) => {
      const k = (r.estado || '').toLowerCase();
      if (k === 'presente') acc.P++;
      else if (k === 'ausente') acc.A++;
      else if (k === 'tarde') acc.T++;
      return acc;
    },
    { P: 0, A: 0, T: 0 }
  );

  const fechaFormat = fechaActual
    .toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    .toUpperCase();

  // ===================================================
  // RENDER
  // ===================================================
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: Colors.background }]}
    >

      {/* HEADER */}
      <View
        style={[
          styles.header,
          { backgroundColor: Colors.surfaceContainerHighest }
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.onSurface }]}>
          {esDocente ? 'Tomar Asistencia' : 'Mi asistencia'}
        </Text>
        <View style={{ width: 24 }} />
      </View>


      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >

        {/* TOAST DE ÉXITO (docente) */}
        {mostrarExito && (
          <View
            style={[
              styles.successToast,
              { backgroundColor: Colors.surfaceContainerHigh }
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={Colors.primary}
            />
            <Text
              style={[styles.successTitle, { color: Colors.onSurface }]}
            >
              Asistencia guardada correctamente
            </Text>
          </View>
        )}

        {esDocenteOAdmin ? (
          <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15, gap: 10}}>
            <MaterialCommunityIcons name="calendar-today" size={20} color={Colors.primary} />
            <Text style={[styles.dateLabel, { color: Colors.primary, marginBottom: 0 }]}>
              {fechaFormat} (Hoy)
            </Text>
          </View>
        ) : (
          <Text style={[styles.dateLabel, { color: Colors.primary }]}>
            {(nombreClase || 'CLASE').toUpperCase()}
          </Text>
        )}

        {/* RESUMEN DE TOTALES */}
        <View style={styles.summaryContainer}>
          <SummaryBox
            label="PRESENTE"
            value={esDocenteOAdmin ? totales.P : resumenEstudiante.P}
            color={Colors.primary}
          />
          <SummaryBox
            label="AUSENTE"
            value={esDocenteOAdmin ? totales.A : resumenEstudiante.A}
            color={Colors.error}
          />
          <SummaryBox
            label="TARDANZA"
            value={esDocenteOAdmin ? totales.T : resumenEstudiante.T}
            color={Colors.tertiary}
          />
        </View>

        {/* LOADING */}
        {loading && (
          <View style={{ alignItems: 'center', marginTop: 30 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {/* ===================== */}
        {/* VISTA: DOCENTE / ADMIN*/}
        {/* ===================== */}
        {!loading && esDocenteOAdmin && (
          <>
            <View style={styles.listHeader}>
              <Text
                style={[styles.listTitle, { color: Colors.onSurfaceVariant }]}
              >
                LISTA DE ESTUDIANTES ({estudiantes.length})
              </Text>
            </View>

            {estudiantes.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <Image
                  source={{
                    uri: 'https://img.freepik.com/free-vector/no-data-concept-illustration_114360-2506.jpg'
                  }}
                  style={styles.emptyImage}
                />
                <Text style={{ color: Colors.onSurfaceVariant, marginTop: 10 }}>
                  No hay estudiantes inscritos en esta clase
                </Text>
              </View>
            )}

            {estudiantes.map((est) => (
              <View
                key={est.id}
                style={[
                  styles.studentItem,
                  { backgroundColor: Colors.surfaceContainerLow }
                ]}
              >
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: Colors.surfaceContainerHighest }
                  ]}
                >
                  <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>
                    {(est.nombre || '?')[0].toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={[styles.studentName, { color: Colors.onSurface }]}
                    numberOfLines={1}
                  >
                    {est.nombre}
                  </Text>
                  <Text
                    style={[styles.studentId, { color: Colors.onSurfaceVariant }]}
                  >
                    ID: {est.id}
                  </Text>
                </View>

                <View style={styles.optionsRow}>
                  <OptionBtn
                    label="P"
                    active={asistencia[est.id] === 'P'}
                    activeColor={Colors.primary}
                    onPress={() => marcar(est.id, 'P')}
                  />
                  <OptionBtn
                    label="A"
                    active={asistencia[est.id] === 'A'}
                    activeColor={Colors.error}
                    onPress={() => marcar(est.id, 'A')}
                  />
                  <OptionBtn
                    label="T"
                    active={asistencia[est.id] === 'T'}
                    activeColor={Colors.tertiary}
                    onPress={() => marcar(est.id, 'T')}
                  />
                  <TouchableOpacity style={styles.historyBtn} onPress={() => cargarHistorial(est)}>
                    <MaterialCommunityIcons name="history" size={22} color={Colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {esDocente && estudiantes.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.btnSave,
                  {
                    backgroundColor: Colors.primary,
                    opacity: guardando ? 0.7 : 1
                  }
                ]}
                onPress={handleGuardar}
                disabled={guardando}
              >
                <MaterialCommunityIcons
                  name="content-save-check"
                  size={22}
                  color={Colors.onPrimary}
                />
                <Text
                  style={[styles.btnSaveText, { color: Colors.onPrimary }]}
                >
                  {guardando ? 'Guardando...' : 'Finalizar Asistencia'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}


        {/* ===================== */}
        {/* VISTA: ESTUDIANTE     */}
        {/* ===================== */}
        {!loading && !esDocenteOAdmin && (
          <>
            <View style={styles.listHeader}>
              <Text
                style={[styles.listTitle, { color: Colors.onSurfaceVariant }]}
              >
                HISTORIAL ({historial.length})
              </Text>
            </View>

            {historial.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <Image
                  source={{
                    uri: 'https://img.freepik.com/free-vector/calendar-concept-illustration_114360-3137.jpg'
                  }}
                  style={styles.emptyImage}
                />
                <Text style={{ color: Colors.onSurfaceVariant, marginTop: 10 }}>
                  Aún no tienes registros de asistencia
                </Text>
              </View>
            )}

            {historial.map((r) => (
              <View
                key={r.id}
                style={[
                  styles.studentItem,
                  { backgroundColor: Colors.surfaceContainerLow }
                ]}
              >
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: Colors.surfaceContainerHighest }
                  ]}
                >
                  <MaterialCommunityIcons
                    name="calendar"
                    size={20}
                    color={Colors.primary}
                  />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={[styles.studentName, { color: Colors.onSurface }]}
                  >
                    {new Date(r.fecha).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </Text>
                </View>

                <View
                  style={[
                    styles.estadoBadge,
                    {
                      backgroundColor:
                        r.estado === 'presente'
                          ? Colors.primary
                          : r.estado === 'ausente'
                          ? Colors.error
                          : Colors.tertiary
                    }
                  ]}
                >
                  <Text style={styles.estadoText}>
                    {String(r.estado || '').toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* MODAL DE HISTORIAL POR ESTUDIANTE */}
        <Modal visible={modalVisible} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: Colors.surfaceContainerLow }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: Colors.onSurface }]}>Historial de Asistencia</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.onSurface} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.modalSubtitle, { color: Colors.primary }]}>
                {estudianteSeleccionado?.nombre}
              </Text>
              
              {loadingHistorial ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 30 }} />
              ) : historialEstudiante.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: 20, color: Colors.onSurfaceVariant }}>
                  Sin registros de asistencia aún.
                </Text>
              ) : (
                <ScrollView style={{ maxHeight: 300, marginTop: 10 }}>
                  {historialEstudiante.map((reg) => (
                    <View key={reg.id} style={[styles.historyRow, { borderBottomColor: Colors.outlineVariant }]}>
                      <Text style={{ color: Colors.onSurface }}>
                        {new Date(reg.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                      <View style={[styles.historyBadge, { backgroundColor: reg.estado === 'presente' ? Colors.primary + '22' : reg.estado === 'ausente' ? Colors.error + '22' : Colors.tertiary + '22' }]}>
                        <Text style={[styles.historyBadgeText, { color: reg.estado === 'presente' ? Colors.primary : reg.estado === 'ausente' ? Colors.error : Colors.tertiary }]}>
                          {reg.estado.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const SummaryBox = ({ label, value, color }) => (
  <View
    style={[
      styles.summaryBox,
      { backgroundColor: Colors.surfaceContainerLow }
    ]}
  >
    <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    <Text style={[styles.summaryValue, { color: Colors.onSurface }]}>
      {value}
    </Text>
  </View>
);

const OptionBtn = ({ label, active, activeColor, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.optionCircle,
      {
        borderColor: Colors.outlineVariant,
        backgroundColor: Colors.surfaceContainerHighest
      },
      active && { backgroundColor: activeColor, borderColor: activeColor }
    ]}
  >
    <Text
      style={[
        styles.optionText,
        { color: Colors.onSurfaceVariant },
        active && { color: 'white' }
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15
  },
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  scrollContent: { padding: 20 },
  dateLabel: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 15
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25
  },
  summaryBox: {
    width: '31%',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2
  },
  summaryLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  summaryValue: { fontSize: 22, fontWeight: 'bold' },
  listHeader: { marginBottom: 15 },
  listTitle: { fontSize: 12, fontWeight: 'bold' },
  studentItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    alignItems: 'center',
    elevation: 1
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  studentName: { fontWeight: 'bold', fontSize: 14 },
  studentId: { fontSize: 10 },
  optionsRow: { flexDirection: 'row', gap: 6 },
  optionCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  optionText: { fontSize: 13, fontWeight: 'bold' },
  btnSave: {
    flexDirection: 'row',
    padding: 18,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    elevation: 4
  },
  btnSaveText: { fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  successToast: {
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: '#4A90E2'
  },
  successTitle: { fontWeight: 'bold', fontSize: 13, marginLeft: 10 },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10
  },
  estadoText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  emptyImage: { width: 180, height: 180, resizeMode: 'contain' }
});
