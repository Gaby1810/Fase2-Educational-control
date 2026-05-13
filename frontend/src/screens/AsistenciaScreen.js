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
  Image
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { get, post } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function AsistenciaScreen({ route, navigation }) {

  const { claseId, nombreClase } = route?.params || {};
  const { usuario } = useAuth();
  const esDocente = usuario?.rol === 'docente';

  const [loading, setLoading] = useState(true);

  // Estudiante: su historial de asistencia
  const [historial, setHistorial] = useState([]);

  // Docente: estudiantes inscritos + estado marcado por id
  const [estudiantes, setEstudiantes] = useState([]);
  const [asistencia, setAsistencia] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);

  // ===================================================
  // CARGAR DATOS
  // ===================================================
  useEffect(() => {
    if (!claseId) {
      setLoading(false);
      return;
    }
    cargar();
  }, [claseId]);

  const cargar = async () => {
    try {
      setLoading(true);
      if (esDocente) {
        const lista = await get(`/clases/${claseId}/estudiantes`);
        setEstudiantes(Array.isArray(lista) ? lista : []);
      } else {
        const hist = await get(`/asistencia/clase/${claseId}`);
        setHistorial(Array.isArray(hist) ? hist : []);
      }
    } catch (e) {
      console.log('Error asistencia:', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // DOCENTE: marcar y guardar
  // ===================================================
  const marcar = (estudianteId, estado) => {
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

      await post('/asistencia/guardar', {
        clase_id: claseId,
        fecha: new Date().toISOString().split('T')[0],
        datos: asistencia
      });

      setMostrarExito(true);
      setTimeout(() => {
        setMostrarExito(false);
        navigation.goBack();
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

  const fechaHoy = new Date()
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


      <ScrollView contentContainerStyle={styles.scrollContent}>

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


        {esDocente
          ? (
            <Text style={[styles.dateLabel, { color: Colors.primary }]}>
              {fechaHoy}
            </Text>
          )
          : (
            <Text style={[styles.dateLabel, { color: Colors.primary }]}>
              {(nombreClase || 'CLASE').toUpperCase()}
            </Text>
          )
        }


        {/* RESUMEN DE TOTALES */}
        <View style={styles.summaryContainer}>
          <SummaryBox
            label="PRESENTE"
            value={esDocente ? totales.P : resumenEstudiante.P}
            color={Colors.primary}
          />
          <SummaryBox
            label="AUSENTE"
            value={esDocente ? totales.A : resumenEstudiante.A}
            color={Colors.error}
          />
          <SummaryBox
            label="TARDANZA"
            value={esDocente ? totales.T : resumenEstudiante.T}
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
        {/* VISTA: DOCENTE        */}
        {/* ===================== */}
        {!loading && esDocente && (
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
                </View>
              </View>
            ))}

            {estudiantes.length > 0 && (
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
        {!loading && !esDocente && (
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
