import React, { useMemo, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { get } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ESTADOS = [
  { key: 'todas', label: 'Todas' },
  { key: 'incompleta', label: 'Incompletas' },
  { key: 'completa', label: 'Completas' }
];

export default function TareasScreen({ route, navigation }) {

  const claseId = route?.params?.claseId;
  const nombreClase = route?.params?.nombreClase || 'Tareas activas';
  const modoGeneral = !claseId;

  const { usuario } = useAuth();
  const esDocente = usuario?.rol === 'docente';

  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('todas');
  const [materiaFiltro, setMateriaFiltro] = useState('todas');

  const materias = useMemo(() => {
    const mapa = new Map();
    tareas.forEach((tarea) => {
      if (tarea.clase_id && tarea.clase_nombre) {
        mapa.set(String(tarea.clase_id), tarea.clase_nombre);
      }
    });
    return Array.from(mapa, ([id, nombre]) => ({ id, nombre }));
  }, [tareas]);

  const tareasFiltradas = useMemo(() => {
    return tareas.filter((tarea) => {
      const coincideEstado =
        esDocente || estadoFiltro === 'todas' || tarea.estado === estadoFiltro;
      const coincideMateria =
        !modoGeneral ||
        materiaFiltro === 'todas' ||
        String(tarea.clase_id) === String(materiaFiltro);

      return coincideEstado && coincideMateria;
    });
  }, [estadoFiltro, materiaFiltro, modoGeneral, tareas]);

  const resumen = useMemo(() => {
    const completas = tareas.filter((tarea) => tarea.estado === 'completa').length;
    const incompletas = tareas.filter((tarea) => tarea.estado !== 'completa').length;
    return { completas, incompletas, total: tareas.length };
  }, [tareas]);

  const obtenerTareas = async () => {
    if (esDocente && !claseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const endpoint = claseId && esDocente
        ? `/tareas/clase/${claseId}`
        : `/tareas/estudiante${claseId ? `?clase_id=${claseId}` : ''}`;
      const data = await get(endpoint);
      setTareas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Error al obtener tareas:', error);
      setTareas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', obtenerTareas);
    return unsubscribe;
  }, [navigation, claseId, esDocente]);

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString();
  };

  const colorEstado = (tarea) => {
    if (tarea.estado === 'completa') return Colors.secondary;
    if (tarea.vencida) return Colors.error;
    return Colors.tertiary;
  };

  const textoEstado = (tarea) => {
    if (tarea.estado === 'completa') return 'Completa';
    if (tarea.vencida) return 'Vencida';
    return 'Incompleta';
  };

  if (esDocente && !claseId) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: Colors.background }]}>
        <MaterialCommunityIcons name="clipboard-text-outline" size={76} color={Colors.outline} />
        <Text style={[styles.emptyTitle, { color: Colors.onSurface }]}>
          Selecciona una clase
        </Text>
        <Text style={[styles.emptyText, { color: Colors.onSurfaceVariant }]}>
          Las tareas de docentes se administran desde el detalle de cada clase.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>

      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: Colors.onSurface }]} numberOfLines={1}>
            {nombreClase}
          </Text>
          <Text style={[styles.headerSubtitle, { color: Colors.onSurfaceVariant }]}>
            {modoGeneral ? 'Todas tus materias' : 'Trabajos asignados'}
          </Text>
        </View>

        {esDocente && claseId ? (
          <TouchableOpacity onPress={() => navigation.navigate('SubirTarea', { claseId })}>
            <Ionicons name="add-circle" size={30} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 30 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={[styles.summaryCard, { backgroundColor: Colors.surfaceContainerLow }]}>
          <View>
            <Text style={[styles.summaryLabel, { color: Colors.onSurfaceVariant }]}>
              Tareas activas
            </Text>
            <Text style={[styles.summaryValue, { color: Colors.onSurface }]}>
              {resumen.total}
            </Text>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.tertiary }]}>
                {resumen.incompletas}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.onSurfaceVariant }]}>
                Incompletas
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: Colors.secondary }]}>
                {resumen.completas}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.onSurfaceVariant }]}>
                Completas
              </Text>
            </View>
          </View>
        </View>

        {modoGeneral && materias.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                materiaFiltro === 'todas' && styles.filterChipActive
              ]}
              onPress={() => setMateriaFiltro('todas')}
            >
              <Text
                style={[
                  styles.filterText,
                  materiaFiltro === 'todas' && styles.filterTextActive
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>

            {materias.map((materia) => (
              <TouchableOpacity
                key={materia.id}
                style={[
                  styles.filterChip,
                  materiaFiltro === materia.id && styles.filterChipActive
                ]}
                onPress={() => setMateriaFiltro(materia.id)}
              >
                <Text
                  style={[
                    styles.filterText,
                    materiaFiltro === materia.id && styles.filterTextActive
                  ]}
                  numberOfLines={1}
                >
                  {materia.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {!esDocente && (
          <View style={styles.segmented}>
            {ESTADOS.map((estado) => (
              <TouchableOpacity
                key={estado.key}
                style={[
                  styles.segment,
                  estadoFiltro === estado.key && styles.segmentActive
                ]}
                onPress={() => setEstadoFiltro(estado.key)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    estadoFiltro === estado.key && styles.segmentTextActive
                  ]}
                >
                  {estado.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading && (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.emptyText, { color: Colors.onSurfaceVariant }]}>
              Cargando tareas...
            </Text>
          </View>
        )}

        {!loading && tareasFiltradas.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              size={80}
              color={Colors.outline}
            />
            <Text style={[styles.emptyTitle, { color: Colors.onSurface }]}>
              No hay tareas para este filtro
            </Text>
            <Text style={[styles.emptyText, { color: Colors.onSurfaceVariant }]}>
              Cambia la materia o el estado para ver otros resultados.
            </Text>
          </View>
        )}

        {!loading && tareasFiltradas.map((item) => (
          <View
            key={`${item.clase_id || claseId}-${item.id}`}
            style={[styles.tareaCard, { backgroundColor: Colors.surfaceContainerLow }]}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconBox, { backgroundColor: colorEstado(item) + '22' }]}>
                <MaterialCommunityIcons
                  name={item.estado === 'completa' ? 'check-circle' : 'clipboard-clock-outline'}
                  size={26}
                  color={colorEstado(item)}
                />
              </View>

              <View style={styles.cardTitleWrap}>
                <Text style={[styles.tareaTitle, { color: Colors.onSurface }]} numberOfLines={2}>
                  {item.titulo}
                </Text>
                {modoGeneral && (
                  <Text style={[styles.materiaText, { color: Colors.primary }]} numberOfLines={1}>
                    {item.clase_nombre || 'Materia'}
                  </Text>
                )}
              </View>

              {!esDocente && (
                <View style={[styles.statusBadge, { backgroundColor: colorEstado(item) }]}>
                  <Text style={styles.statusText}>{textoEstado(item)}</Text>
                </View>
              )}
            </View>

            {!!item.instrucciones && (
              <Text style={[styles.tareaDesc, { color: Colors.onSurfaceVariant }]}>
                {item.instrucciones}
              </Text>
            )}

            <View style={styles.divider} />

            <View style={styles.cardFooter}>
              <View style={styles.dateInfo}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={16}
                  color={item.vencida ? Colors.error : Colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.dateText,
                    { color: item.vencida ? Colors.error : Colors.onSurfaceVariant }
                  ]}
                >
                  Entrega: {formatearFecha(item.fecha_entrega)}
                </Text>
              </View>

              {item.fecha_entregada && (
                <Text style={[styles.entregaText, { color: Colors.secondary }]}>
                  Entregada {formatearFecha(item.fecha_entregada)}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  header: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerText: {
    flex: 1,
    marginHorizontal: 12
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 17
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 34
  },
  summaryCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  summaryValue: {
    fontSize: 38,
    fontWeight: '800',
    marginTop: 2
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 18
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800'
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2
  },
  filterRow: {
    gap: 10,
    paddingBottom: 12
  },
  filterChip: {
    maxWidth: 170,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.outlineVariant
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary
  },
  filterText: {
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    fontSize: 12
  },
  filterTextActive: {
    color: Colors.onPrimary
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10
  },
  segmentActive: {
    backgroundColor: Colors.primary
  },
  segmentText: {
    color: Colors.onSurfaceVariant,
    fontWeight: '700',
    fontSize: 12
  },
  segmentTextActive: {
    color: Colors.onPrimary
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 42,
    paddingHorizontal: 18
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
    textAlign: 'center'
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8
  },
  tareaCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardTitleWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },
  tareaTitle: {
    fontWeight: '800',
    fontSize: 16
  },
  materiaText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10
  },
  statusText: {
    color: '#001645',
    fontWeight: '800',
    fontSize: 11
  },
  tareaDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12
  },
  cardFooter: {
    gap: 8
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700'
  },
  entregaText: {
    fontSize: 12,
    fontWeight: '700'
  }
});
