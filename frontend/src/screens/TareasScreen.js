import React, { useState, useEffect, useMemo } from 'react';

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';

import {
  MaterialCommunityIcons,
  Ionicons
} from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { get, post } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const estados = [
  { key: 'todas', label: 'Todas' },
  { key: 'incompletas', label: 'Incompletas' },
  { key: 'completas', label: 'Completas' }
];

export default function TareasScreen({
  route,
  navigation
}) {

  const claseId = route?.params?.claseId || null;
  const nombreClase = route?.params?.nombreClase || "Tareas activas";

  const [tareas, setTareas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [resumen, setResumen] = useState({ total: 0, completas: 0, incompletas: 0 });
  const [loading, setLoading] = useState(true);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(claseId ? String(claseId) : 'todas');
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('todas');

  const { usuario } = useAuth();
  const esDocente = usuario?.rol === 'docente';
  const vistaGlobalEstudiante = !claseId && !esDocente;

  const materiaFiltro = useMemo(() => {
    if (claseId) return claseId;
    return materiaSeleccionada === 'todas' ? null : materiaSeleccionada;
  }, [claseId, materiaSeleccionada]);

  const obtenerTareas = async () => {
    try {
      setLoading(true);

      if (vistaGlobalEstudiante) {
        const params = [`estado=${encodeURIComponent(estadoSeleccionado)}`];
        if (materiaFiltro) params.push(`clase_id=${encodeURIComponent(materiaFiltro)}`);

        const data = await get(`/tareas/estudiante?${params.join('&')}`);
        setTareas(Array.isArray(data.tareas) ? data.tareas : []);
        setMaterias(Array.isArray(data.materias) ? data.materias : []);
        setResumen(data.resumen || { total: 0, completas: 0, incompletas: 0 });
        return;
      }

      if (!claseId) {
        setTareas([]);
        return;
      }

      const data = await get(`/tareas/clase/${claseId}`);
      setTareas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log("Error al obtener tareas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      obtenerTareas();
    });

    return unsubscribe;
  }, [navigation, claseId, estadoSeleccionado, materiaFiltro, vistaGlobalEstudiante]);

  useEffect(() => {
    obtenerTareas();
  }, [estadoSeleccionado, materiaFiltro]);

  const formatoFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString();
  };

  const etiquetaTiempo = (item) => {
    if (!item.fecha_entrega) return 'Sin fecha limite';
    if (item.estado_entrega === 'completa') return 'Entregada';

    const dias = Number(item.dias_restantes);
    if (!Number.isFinite(dias)) return 'Pendiente';
    if (dias < 0) return 'Vencida';
    if (dias === 0) return 'Entrega hoy';
    if (dias === 1) return 'Manana';
    return `${dias} dias`;
  };

  const colorEstado = (item) => {
    if (esDocente) return Colors.primary;
    if (item.estado_entrega === 'completa') return Colors.secondary;
    const dias = Number(item.dias_restantes);
    if (Number.isFinite(dias) && dias < 0) return Colors.error;
    return Colors.tertiary;
  };

  const marcarCompleta = async (item) => {
    try {
      await post(`/tareas/${item.id}/entregar`, {});
      await obtenerTareas();
    } catch (error) {
      Alert.alert('No se pudo completar', error.message || 'Intenta de nuevo.');
    }
  };

  const textoEstado = (item) => {
    if (esDocente) {
      const entregas = Number(item.total_entregas || 0);
      return `${entregas} entrega${entregas === 1 ? '' : 's'}`;
    }

    return item.estado_entrega === 'completa' ? 'Completada' : 'Incompleta';
  };

  const renderChip = (label, active, onPress) => (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: active ? Colors.primary : Colors.surfaceContainerLow,
          borderColor: active ? Colors.primary : Colors.outlineVariant
        }
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, { color: active ? Colors.onPrimary : Colors.onSurfaceVariant }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>

      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: Colors.onSurface }]} numberOfLines={1}>
            {vistaGlobalEstudiante ? 'Tareas activas' : nombreClase}
          </Text>
          <Text style={[styles.headerSubtitle, { color: Colors.onSurfaceVariant }]}>
            {vistaGlobalEstudiante ? 'Todas tus materias' : 'Trabajos asignados'}
          </Text>
        </View>

        {esDocente && claseId ? (
          <TouchableOpacity onPress={() => navigation.navigate('SubirTarea', { claseId, nombreClase })}>
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {vistaGlobalEstudiante && (
          <>
            <View style={[styles.summaryCard, { backgroundColor: Colors.surfaceContainerHigh }]}>
              <View>
                <Text style={[styles.summaryLabel, { color: Colors.onSurfaceVariant }]}>
                  Pendientes
                </Text>
                <Text style={[styles.summaryValue, { color: Colors.tertiary }]}>
                  {resumen.incompletas || 0}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View>
                <Text style={[styles.summaryLabel, { color: Colors.onSurfaceVariant }]}>
                  Completas
                </Text>
                <Text style={[styles.summaryValue, { color: Colors.secondary }]}>
                  {resumen.completas || 0}
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View>
                <Text style={[styles.summaryLabel, { color: Colors.onSurfaceVariant }]}>
                  Total
                </Text>
                <Text style={[styles.summaryValue, { color: Colors.onSurface }]}>
                  {resumen.total || 0}
                </Text>
              </View>
            </View>

            <Text style={[styles.filterTitle, { color: Colors.onSurfaceVariant }]}>
              MATERIA
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {renderChip('Todas', materiaSeleccionada === 'todas', () => setMateriaSeleccionada('todas'))}
              {materias.map((materia) => renderChip(
                materia.nombre,
                materiaSeleccionada === String(materia.id),
                () => setMateriaSeleccionada(String(materia.id))
              ))}
            </ScrollView>

            <Text style={[styles.filterTitle, { color: Colors.onSurfaceVariant }]}>
              ESTADO
            </Text>
            <View style={styles.chipsRow}>
              {estados.map((estado) => renderChip(
                estado.label,
                estadoSeleccionado === estado.key,
                () => setEstadoSeleccionado(estado.key)
              ))}
            </View>
          </>
        )}

        {loading && (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.emptyText, { color: Colors.onSurfaceVariant }]}>
              Cargando tareas...
            </Text>
          </View>
        )}

        {!loading && tareas.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={78}
              color={Colors.outline}
            />
            <Text style={[styles.emptyText, { color: Colors.onSurfaceVariant }]}>
              No hay tareas para este filtro.
            </Text>
          </View>
        )}

        {!loading && tareas.map((item) => (
          <View
            key={item.id}
            style={[styles.tareaCard, { backgroundColor: Colors.surfaceContainerLow }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: colorEstado(item) + '22' }]}>
                <MaterialCommunityIcons
                  name={esDocente ? 'clipboard-check-outline' : item.estado_entrega === 'completa' ? 'check-circle' : 'clipboard-text-outline'}
                  size={25}
                  color={colorEstado(item)}
                />
              </View>

              <View style={styles.cardTitleBlock}>
                <Text style={[styles.tareaTitle, { color: Colors.onSurface }]} numberOfLines={2}>
                  {item.titulo}
                </Text>
                {vistaGlobalEstudiante && (
                  <Text style={[styles.materiaText, { color: Colors.onSurfaceVariant }]} numberOfLines={1}>
                    {item.materia}
                  </Text>
                )}
              </View>

              <View style={[styles.estadoBadge, { backgroundColor: colorEstado(item) }]}>
                <Text style={styles.estadoText}>{etiquetaTiempo(item)}</Text>
              </View>
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
                  color={Colors.onSurfaceVariant}
                />
                <Text style={[styles.dateText, { color: Colors.onSurfaceVariant }]}>
                  Entrega: {formatoFecha(item.fecha_entrega)}
                </Text>
              </View>

              {!esDocente && item.estado_entrega !== 'completa' ? (
                <TouchableOpacity
                  style={[styles.completeBtn, { borderColor: Colors.secondary }]}
                  onPress={() => marcarCompleta(item)}
                >
                  <Text style={[styles.completeBtnText, { color: Colors.secondary }]}>
                    Completar
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.statusText, { color: colorEstado(item) }]}>
                  {textoEstado(item)}
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

  container: {
    flex: 1
  },

  header: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10
  },

  backBtn: {
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

  content: {
    padding: 20,
    paddingBottom: 34
  },

  summaryCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase'
  },

  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center'
  },

  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.12)'
  },

  filterTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10
  },

  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
    paddingRight: 8
  },

  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9
  },

  chipText: {
    fontSize: 12,
    fontWeight: '800'
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 42
  },

  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center'
  },

  tareaCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 3
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },

  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },

  cardTitleBlock: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8
  },

  tareaTitle: {
    fontWeight: 'bold',
    fontSize: 15
  },

  materiaText: {
    fontSize: 12,
    marginTop: 3
  },

  estadoBadge: {
    maxWidth: 92,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 7
  },

  estadoText: {
    color: '#071331',
    fontSize: 10,
    fontWeight: '900',
    textAlign: 'center'
  },

  tareaDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10
  },

  dateInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },

  dateText: {
    fontSize: 12,
    fontWeight: '600'
  },

  statusText: {
    fontSize: 12,
    fontWeight: '900'
  },

  completeBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7
  },

  completeBtnText: {
    fontSize: 12,
    fontWeight: '900'
  }

});
