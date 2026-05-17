import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { get, post } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function NotasScreen({ route, navigation }) {

  const claseId = route?.params?.claseId;
  const tareaNombre = route?.params?.tareaNombre || 'Promedio general';
  const modoGeneral = !claseId;

  const { usuario } = useAuth();
  const esDocente = usuario?.rol === 'docente';

  const [notas, setNotas] = useState([]);
  const [resumenGeneral, setResumenGeneral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [estudiantes, setEstudiantes] = useState([]);
  const [tareasClase, setTareasClase] = useState([]);
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [formNota, setFormNota] = useState({ estudiante_id: '', evaluacion: '', calificacion: '' });

  useEffect(() => {
    cargarNotas();
  }, [claseId]);

  const cargarNotas = async () => {
    try {
      setLoading(true);

      if (modoGeneral && !esDocente) {
        const data = await get('/notas/promedio-general');
        setResumenGeneral(data);
        setNotas(Array.isArray(data?.materias) ? data.materias : []);
        return;
      }

      if (!claseId) {
        setNotas([]);
        setResumenGeneral(null);
        return;
      }

      const data = await get(`/notas/clase/${claseId}`);
      setNotas(Array.isArray(data) ? data : []);
      setResumenGeneral(null);
    } catch (e) {
      console.log('Error notas:', e.message);
      setNotas([]);
      setResumenGeneral(null);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = async () => {
    try {
      const [dataEstudiantes, dataTareas] = await Promise.all([
        get(`/clases/${claseId}/estudiantes`),
        get(`/tareas/clase/${claseId}`)
      ]);
      setEstudiantes(dataEstudiantes || []);
      setTareasClase(dataTareas || []);
      setBusquedaEstudiante('');
      setFormNota({ estudiante_id: '', evaluacion: '', calificacion: '' });
      setModalVisible(true);
    } catch (e) {
      Alert.alert("Error", "No se pudieron cargar los datos");
    }
  };

  const estudiantesFiltrados = estudiantes.filter(e => e.nombre?.toLowerCase().includes(busquedaEstudiante.toLowerCase()));

  const guardarNota = async () => {
    if (!formNota.estudiante_id || !formNota.evaluacion || !formNota.calificacion) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }
    const calif = Number(formNota.calificacion);
    if (calif < 0 || calif > 100 || isNaN(calif)) {
      Alert.alert("Error", "La calificación debe estar entre 0 y 100");
      return;
    }

    try {
      await post('/notas/guardar', {
        clase_id: claseId,
        estudiante_id: formNota.estudiante_id,
        evaluacion: formNota.evaluacion,
        calificacion: calif
      });
      setModalVisible(false);
      cargarNotas();
    } catch (e) {
      Alert.alert("Error", e.response?.data?.error || "No se pudo guardar la nota");
    }
  };

  const promedioClase = notas.length
    ? (
        notas.reduce((s, n) => s + Number(n.calificacion || 0), 0) /
        notas.length
      ).toFixed(2)
    : null;

  const promedio = modoGeneral && !esDocente
    ? resumenGeneral?.promedio_general
    : promedioClase;

  const filtradas = notas.filter((n) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;

    if (modoGeneral) {
      return (
        String(n.materia || '').toLowerCase().includes(q) ||
        String(n.docente || '').toLowerCase().includes(q)
      );
    }

    return (
      String(n.evaluacion || '').toLowerCase().includes(q) ||
      String(n.estudiante || '').toLowerCase().includes(q)
    );
  });

  const colorNota = (cal) => {
    const v = Number(cal);
    if (v >= 7) return Colors.secondary;
    if (v >= 5) return Colors.tertiary;
    return Colors.error;
  };

  const textoPromedio = (valor) => {
    if (valor === null || valor === undefined) return '--';
    return Number(valor).toFixed(2);
  };

  const totalNotas = modoGeneral && !esDocente
    ? resumenGeneral?.total_notas || 0
    : notas.length;

  const totalMaterias = modoGeneral && !esDocente
    ? resumenGeneral?.total_materias || 0
    : 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>

      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.headerTitle, { color: Colors.onSurface }]} numberOfLines={1}>
            {tareaNombre}
          </Text>
          <Text style={{ fontSize: 10, color: Colors.primary }}>
            {modoGeneral && !esDocente
              ? 'Todas tus materias'
              : esDocente
                ? 'Notas de la clase'
                : 'Mis calificaciones'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={[styles.progressCard, { backgroundColor: Colors.surfaceContainerLow }]}>
          <View style={styles.chartWrapper}>
            <View style={[styles.circleOuter, { borderColor: colorNota(promedio) }]}>
              <Text style={[styles.progressValue, { color: Colors.onSurface }]}>
                {textoPromedio(promedio)}
              </Text>
              <Text style={[styles.progressLabel, { color: Colors.onSurfaceVariant }]}>
                PROMEDIO
              </Text>
            </View>

            <View style={styles.statsInfo}>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: Colors.secondary }]}>
                  {totalMaterias}
                </Text>
                <Text style={styles.statLabel}>
                  {modoGeneral && !esDocente ? 'Materias' : 'Materia'}
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color: Colors.tertiary }]}>
                  {totalNotas}
                </Text>
                <Text style={styles.statLabel}>
                  {esDocente ? 'Notas registradas' : 'Evaluaciones'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {notas.length > 0 && (
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: Colors.surfaceContainerLow,
                borderColor: Colors.outlineVariant
              }
            ]}
          >
            <Ionicons name="search" size={18} color={Colors.onSurfaceVariant} />
            <TextInput
              placeholder={
                modoGeneral
                  ? 'Buscar materia...'
                  : esDocente
                    ? 'Buscar nota o estudiante...'
                    : 'Buscar evaluacion...'
              }
              placeholderTextColor="#8aa8ff"
              style={[styles.searchInput, { color: Colors.onSurface }]}
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>
        )}

        {loading && (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {!loading && notas.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chart-bar" size={78} color={Colors.outline} />
            <Text style={[styles.emptyText, { color: Colors.onSurfaceVariant }]}>
              {modoGeneral && !esDocente
                ? 'Aun no tienes notas en tus materias'
                : esDocente
                  ? 'Aun no hay notas registradas en esta clase'
                  : 'Aun no tienes notas en esta clase'}
            </Text>
          </View>
        )}

        <View style={styles.listContainer}>
          {!loading && filtradas.map((n) => (
            modoGeneral && !esDocente ? (
              <View
                key={n.id}
                style={[styles.card, { backgroundColor: Colors.surfaceContainerLow }]}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: colorNota(n.promedio) + '22' }
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="book-education-outline"
                      size={26}
                      color={n.promedio == null ? Colors.outline : colorNota(n.promedio)}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.evalName, { color: Colors.onSurface }]} numberOfLines={1}>
                      {n.materia || 'Materia'}
                    </Text>
                    <Text style={[styles.studentSub, { color: Colors.onSurfaceVariant }]} numberOfLines={1}>
                      {n.total_notas > 0
                        ? `${n.total_notas} evaluaciones`
                        : 'Sin notas registradas'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.gradeBadge,
                      { backgroundColor: n.promedio == null ? Colors.outline : colorNota(n.promedio) }
                    ]}
                  >
                    <Text style={styles.gradeText}>
                      {textoPromedio(n.promedio)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View
                key={n.id}
                style={[styles.card, { backgroundColor: Colors.surfaceContainerLow }]}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: colorNota(n.calificacion) + '22' }
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="star-circle"
                      size={26}
                      color={colorNota(n.calificacion)}
                    />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.evalName, { color: Colors.onSurface }]} numberOfLines={1}>
                      {n.evaluacion || 'Evaluacion'}
                    </Text>

                    {esDocente && (
                      <Text style={[styles.studentSub, { color: Colors.onSurfaceVariant }]} numberOfLines={1}>
                        {n.estudiante || `Estudiante #${n.estudiante_id}`}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.gradeBadge, { backgroundColor: colorNota(n.calificacion) }]}>
                    <Text style={styles.gradeText}>
                      {Number(n.calificacion).toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            )
          ))}
        </View>
      </ScrollView>

      {esDocente && !modoGeneral && (
        <TouchableOpacity style={styles.fab} onPress={abrirModal}>
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: Colors.surfaceContainerLow }]}>
            <Text style={[styles.modalTitle, { color: Colors.onSurface }]}>Registrar Nota</Text>

            <Text style={{color: Colors.onSurfaceVariant, fontSize: 12, marginBottom: 5, marginTop: 10}}>Selecciona un Estudiante:</Text>
            <TextInput
              style={[styles.inputModal, { color: Colors.onSurface, borderColor: Colors.outline, marginBottom: 5, paddingVertical: 6 }]}
              placeholder="Buscar estudiante..."
              placeholderTextColor={Colors.onSurfaceVariant}
              value={busquedaEstudiante}
              onChangeText={setBusquedaEstudiante}
            />
            <ScrollView style={{maxHeight: 120, marginBottom: 10}}>
              {estudiantesFiltrados.map(est => (
                <TouchableOpacity
                  key={est.id}
                  style={[styles.estudianteRow, formNota.estudiante_id === est.id && { backgroundColor: Colors.primaryContainer }]}
                  onPress={() => setFormNota({ ...formNota, estudiante_id: est.id })}
                >
                  <Text style={{ color: formNota.estudiante_id === est.id ? Colors.onPrimaryContainer : Colors.onSurface }}>
                    {est.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={{color: Colors.onSurfaceVariant, fontSize: 12, marginBottom: 5}}>Selecciona la Evaluación (Tarea):</Text>
            <ScrollView style={{maxHeight: 100, marginBottom: 15}}>
              {tareasClase.length === 0 && (
                <Text style={{color: Colors.onSurfaceVariant, fontStyle: 'italic', fontSize: 12}}>No hay tareas asignadas en esta clase.</Text>
              )}
              {tareasClase.map(tarea => (
                <TouchableOpacity
                  key={tarea.id}
                  style={[styles.estudianteRow, formNota.evaluacion === tarea.titulo && { backgroundColor: Colors.tertiaryContainer }]}
                  onPress={() => setFormNota({ ...formNota, evaluacion: tarea.titulo })}
                >
                  <Text style={{ color: formNota.evaluacion === tarea.titulo ? Colors.onTertiaryContainer : Colors.onSurface }}>
                    {tarea.titulo}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={[styles.inputModal, { color: Colors.onSurface, borderColor: Colors.outline }]}
              placeholder="Calificación (0-100)"
              placeholderTextColor={Colors.onSurfaceVariant}
              keyboardType="numeric"
              value={formNota.calificacion}
              onChangeText={(text) => setFormNota({ ...formNota, calificacion: text })}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBtnCancel}>
                <Text style={{ color: Colors.onSurface }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={guardarNota} style={[styles.modalBtnSave, { backgroundColor: Colors.primary }]}>
                <Text style={{ color: '#FFF' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    elevation: 4
  },
  backBtn: { backgroundColor: '#FFF', borderRadius: 10, padding: 5 },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  progressCard: { margin: 20, borderRadius: 22, padding: 20 },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  circleOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 7,
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressValue: { fontSize: 23, fontWeight: '800' },
  progressLabel: { fontSize: 8, fontWeight: 'bold' },
  statsInfo: { alignItems: 'center', gap: 12 },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: '#999', marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 10
  },
  searchInput: { marginLeft: 10, flex: 1, fontSize: 14 },
  emptyContainer: { alignItems: 'center', marginTop: 30, paddingHorizontal: 20 },
  emptyText: { marginTop: 12, fontSize: 14, textAlign: 'center' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 30 },
  card: { borderRadius: 16, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  evalName: { fontSize: 15, fontWeight: 'bold' },
  studentSub: { fontSize: 12, marginTop: 2 },
  gradeBadge: {
    minWidth: 58,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center'
  },
  gradeText: { color: '#001645', fontWeight: 'bold', fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    borderRadius: 15,
    padding: 20,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  estudianteRow: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  inputModal: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15
  },
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10
  },
  modalBtnCancel: {
    padding: 10,
    marginRight: 10
  },
  modalBtnSave: {
    padding: 10,
    borderRadius: 8,
    paddingHorizontal: 20
  }
});
