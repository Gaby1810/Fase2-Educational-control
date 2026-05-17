import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { get, post } from '../services/api';
import API_BASE_URL from '../constants/api';

export default function EntregasTareaScreen({ route, navigation }) {
  const { tareaId, tareaTitulo, claseId } = route.params;
  const [entregas, setEntregas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [calificaciones, setCalificaciones] = useState({});
  const [guardandoNota, setGuardandoNota] = useState(null);

  useEffect(() => {
    cargarEntregas();
  }, [tareaId]);

  const cargarEntregas = async () => {
    try {
      setLoading(true);
      const data = await get(`/tareas/${tareaId}/entregas`);
      setEntregas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Error obteniendo entregas:', e.message);
      Alert.alert("Error", "No se pudieron cargar las entregas");
    } finally {
      setLoading(false);
    }
  };

  const abrirArchivo = async (archivo) => {
    if (!archivo) return;
    const baseUrl = API_BASE_URL.replace('/api', '');
    const url = `${baseUrl}/uploads/${archivo}`;
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir el archivo');
    }
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleString();
  };

  const calificarEntrega = async (estudianteId) => {
    const nota = calificaciones[estudianteId];
    if (!nota || isNaN(nota) || nota < 0 || nota > 100) {
      Alert.alert('Invalido', 'Ingrese una calificación válida entre 0 y 100');
      return;
    }

    try {
      setGuardandoNota(estudianteId);
      await post('/notas/guardar', {
        calificacion: parseFloat(nota),
        evaluacion: tareaTitulo,
        clase_id: claseId,
        estudiante_id: estudianteId
      });
      Alert.alert('Éxito', 'Calificación guardada correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar la calificación');
    } finally {
      setGuardandoNota(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: Colors.onSurface }]} numberOfLines={1}>
            Entregas
          </Text>
          <Text style={[styles.headerSubtitle, { color: Colors.onSurfaceVariant }]} numberOfLines={1}>
            {tareaTitulo}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading && (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {!loading && entregas.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-off-outline" size={60} color={Colors.outline} />
            <Text style={[styles.emptyText, { color: Colors.onSurfaceVariant }]}>
              Aún no hay entregas para esta tarea.
            </Text>
          </View>
        )}

        {!loading && entregas.map((entrega) => (
          <View key={entrega.entrega_id} style={[styles.card, { backgroundColor: Colors.surfaceContainerLow }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: Colors.primary + '22' }]}>
                <Ionicons name="person" size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.studentName, { color: Colors.onSurface }]} numberOfLines={1}>
                  {entrega.estudiante_nombre}
                </Text>
                <Text style={[styles.dateText, { color: Colors.onSurfaceVariant }]}>
                  {formatoFecha(entrega.fecha_entrega)}
                </Text>
              </View>
            </View>

            {entrega.archivo && (
              <TouchableOpacity
                style={[styles.attachmentRow, { backgroundColor: Colors.secondary + '22' }]}
                onPress={() => abrirArchivo(entrega.archivo)}
              >
                <MaterialCommunityIcons name="paperclip" size={18} color={Colors.secondary} />
                <Text style={[styles.attachmentText, { color: Colors.secondary }]} numberOfLines={1}>
                  Ver archivo entregado
                </Text>
                <MaterialCommunityIcons name="download" size={18} color={Colors.secondary} />
              </TouchableOpacity>
            )}

            {/* SECCIÓN DE CALIFICACIÓN */}
            <View style={styles.gradeSection}>
              <TextInput
                style={styles.gradeInput}
                placeholder="Nota (0-100)"
                keyboardType="numeric"
                value={calificaciones[entrega.estudiante_id] || ''}
                onChangeText={(val) => setCalificaciones(prev => ({ ...prev, [entrega.estudiante_id]: val }))}
              />
              <TouchableOpacity
                style={[styles.gradeBtn, { backgroundColor: Colors.primary }]}
                onPress={() => calificarEntrega(entrega.estudiante_id)}
                disabled={guardandoNota === entrega.estudiante_id}
              >
                {guardandoNota === entrega.estudiante_id ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.gradeBtnText}>Calificar</Text>
                )}
              </TouchableOpacity>
            </View>

          </View>
        ))}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center'
  },
  headerText: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontWeight: 'bold', fontSize: 17 },
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  content: { padding: 20, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { marginTop: 15, fontSize: 15, textAlign: 'center' },
  card: { borderRadius: 16, padding: 16, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 16, fontWeight: 'bold' },
  dateText: { fontSize: 12, marginTop: 3 },
  attachmentRow: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 8
  },
  attachmentText: { flex: 1, fontSize: 13, fontWeight: '600' },
  gradeSection: {
    flexDirection: 'row',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center'
  },
  gradeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#FFF'
  },
  gradeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  gradeBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14
  }
});
