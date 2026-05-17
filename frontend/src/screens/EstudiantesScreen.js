import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { get, del } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function EstudiantesScreen({ route, navigation }) {
  const { claseId, nombreClase } = route?.params || {};
  const { usuario } = useAuth();
  const esDocente = usuario?.rol === 'docente';

  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!claseId || !esDocente) {
      navigation.goBack();
      return;
    }
    cargarEstudiantes();
  }, [claseId]);

  const cargarEstudiantes = async () => {
    try {
      setLoading(true);
      const lista = await get(`/clases/${claseId}/estudiantes`);
      setEstudiantes(Array.isArray(lista) ? lista : []);
    } catch (e) {
      Alert.alert('Error', e.message || 'Error al obtener estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarEstudiantes();
    setRefreshing(false);
  };

  const handleExpulsar = (estudianteId, nombre) => {
    Alert.alert(
      "Expulsar estudiante",
      `¿Seguro que deseas expulsar a ${nombre} de esta clase? Se perderán sus entregas y asistencia.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Expulsar", style: "destructive", onPress: async () => {
           try {
             await del(`/clases/${claseId}/estudiantes/${estudianteId}`);
             Alert.alert("Éxito", "Estudiante expulsado correctamente");
             cargarEstudiantes();
           } catch (error) {
             Alert.alert("Error", error.message || "No se pudo expulsar al estudiante");
           }
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.onSurface }]} numberOfLines={1}>
          Estudiantes: {nombreClase}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* LOADING */}
        {loading && (
          <View style={{ alignItems: 'center', marginTop: 30 }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}

        {!loading && (
          <>
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: Colors.onSurfaceVariant }]}>
                ALUMNOS INSCRITOS ({estudiantes.length})
              </Text>
            </View>

            {estudiantes.length === 0 && (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Image
                  source={{ uri: 'https://img.freepik.com/free-vector/no-data-concept-illustration_114360-2506.jpg' }}
                  style={styles.emptyImage}
                />
                <Text style={{ color: Colors.onSurfaceVariant, marginTop: 10, fontSize: 16 }}>
                  No hay estudiantes inscritos
                </Text>
              </View>
            )}

            {estudiantes.map((est) => (
              <View key={est.id} style={[styles.studentItem, { backgroundColor: Colors.surfaceContainerLow }]}>
                <View style={[styles.avatarCircle, { backgroundColor: Colors.surfaceContainerHighest }]}>
                  <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 16 }}>
                    {(est.nombre || '?')[0].toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.studentName, { color: Colors.onSurface }]} numberOfLines={1}>
                    {est.nombre}
                  </Text>
                  <Text style={[styles.studentId, { color: Colors.onSurfaceVariant }]}>
                    ID: {est.id} • {est.correo}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.expelBtn}
                  onPress={() => handleExpulsar(est.id, est.nombre)}
                >
                  <MaterialCommunityIcons name="account-remove-outline" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15
  },
  headerTitle: { fontWeight: 'bold', fontSize: 16, flex: 1, textAlign: 'center', marginHorizontal: 10 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  listHeader: { marginBottom: 15 },
  listTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  studentItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center'
  },
  studentName: { fontWeight: 'bold', fontSize: 15 },
  studentId: { fontSize: 11, marginTop: 2 },
  expelBtn: {
    padding: 10,
    backgroundColor: '#ff000015',
    borderRadius: 12
  },
  emptyImage: { width: 180, height: 180, resizeMode: 'contain' }
});
