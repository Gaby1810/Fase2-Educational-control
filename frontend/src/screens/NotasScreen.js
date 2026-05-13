import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { get } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function NotasScreen({ route, navigation }) {

  const claseId = route?.params?.claseId;
  const tareaNombre = route?.params?.tareaNombre || 'Notas';

  const { usuario } = useAuth();
  const esDocente = usuario?.rol === 'docente';

  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (claseId) cargarNotas();
  }, [claseId]);

  const cargarNotas = async () => {
    try {
      setLoading(true);
      const data = await get(`/notas/clase/${claseId}`);
      setNotas(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log('Error notas:', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Promedio (solo si hay datos)
  const promedio = notas.length
    ? (
        notas.reduce((s, n) => s + Number(n.calificacion || 0), 0) /
        notas.length
      ).toFixed(2)
    : null;

  // Filtro por búsqueda
  const filtradas = notas.filter((n) => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return (
      String(n.evaluacion || '').toLowerCase().includes(q) ||
      String(n.estudiante || '').toLowerCase().includes(q)
    );
  });

  // Color según calificación
  const colorNota = (cal) => {
    const v = Number(cal);
    if (v >= 7) return Colors.secondary;
    if (v >= 5) return Colors.tertiary;
    return Colors.error;
  };

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

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text
            style={[styles.headerTitle, { color: Colors.onSurface }]}
            numberOfLines={1}
          >
            {tareaNombre}
          </Text>
          <Text style={{ fontSize: 10, color: Colors.primary }}>
            {esDocente ? 'Notas de la clase' : 'Mis calificaciones'}
          </Text>
        </View>

      </View>


      <ScrollView showsVerticalScrollIndicator={false}>

        {/* TARJETA DE RESUMEN */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: Colors.surfaceContainerLow }
          ]}
        >
          <View style={styles.chartWrapper}>

            <View
              style={[
                styles.circleOuter,
                { borderColor: Colors.primary }
              ]}
            >
              <Text
                style={[
                  styles.progressValue,
                  { color: Colors.onSurface }
                ]}
              >
                {promedio || '—'}
              </Text>
              <Text
                style={[
                  styles.progressLabel,
                  { color: Colors.onSurfaceVariant }
                ]}
              >
                PROMEDIO
              </Text>
            </View>

            <View style={styles.statsInfo}>
              <View style={{ alignItems: 'center' }}>
                <Text
                  style={[styles.statValue, { color: Colors.secondary }]}
                >
                  {notas.length}
                </Text>
                <Text style={styles.statLabel}>
                  {esDocente ? 'Notas registradas' : 'Evaluaciones'}
                </Text>
              </View>
            </View>

          </View>
        </View>


        {/* BUSCADOR */}
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
            <Ionicons
              name="search"
              size={18}
              color={Colors.onSurfaceVariant}
            />
            <TextInput
              placeholder={esDocente ? 'Buscar nota o estudiante...' : 'Buscar evaluación...'}
              placeholderTextColor="#666"
              style={[styles.searchInput, { color: Colors.onSurface }]}
              value={busqueda}
              onChangeText={setBusqueda}
            />
          </View>
        )}


        {/* LOADING */}
        {loading && (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}


        {/* VACÍO */}
        {!loading && notas.length === 0 && (
          <View style={styles.emptyContainer}>
            <Image
              source={{
                uri: 'https://img.freepik.com/free-vector/exam-concept-illustration_114360-7414.jpg'
              }}
              style={styles.emptyImage}
            />
            <Text style={[styles.emptyText, { color: Colors.onSurfaceVariant }]}>
              {esDocente
                ? 'Aún no hay notas registradas en esta clase'
                : 'Aún no tienes notas en esta clase'}
            </Text>
          </View>
        )}


        {/* LISTA DE NOTAS */}
        <View style={styles.listContainer}>

          {!loading && filtradas.map((n) => (

            <View
              key={n.id}
              style={[
                styles.card,
                { backgroundColor: Colors.surfaceContainerLow }
              ]}
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

                  <Text
                    style={[
                      styles.evalName,
                      { color: Colors.onSurface }
                    ]}
                    numberOfLines={1}
                  >
                    {n.evaluacion || 'Evaluación'}
                  </Text>

                  {esDocente && (
                    <Text
                      style={[
                        styles.studentSub,
                        { color: Colors.onSurfaceVariant }
                      ]}
                      numberOfLines={1}
                    >
                      {n.estudiante || `Estudiante #${n.estudiante_id}`}
                    </Text>
                  )}

                </View>

                <View
                  style={[
                    styles.gradeBadge,
                    { backgroundColor: colorNota(n.calificacion) }
                  ]}
                >
                  <Text style={styles.gradeText}>
                    {Number(n.calificacion).toFixed(1)}
                  </Text>
                </View>

              </View>

            </View>
          ))}

        </View>

      </ScrollView>
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

  progressCard: { margin: 20, borderRadius: 24, padding: 20 },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  circleOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center'
  },
  progressValue: { fontSize: 22, fontWeight: '800' },
  progressLabel: { fontSize: 8, fontWeight: 'bold' },
  statsInfo: { alignItems: 'center' },
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
  emptyImage: { width: 200, height: 200, resizeMode: 'contain' },
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
    minWidth: 54,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center'
  },
  gradeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
