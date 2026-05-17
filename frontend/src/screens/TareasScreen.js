import React, { useState, useEffect, useMemo } from 'react';

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  RefreshControl
} from 'react-native';

import {
  MaterialCommunityIcons,
  Ionicons
} from '@expo/vector-icons';

import * as DocumentPicker from 'expo-document-picker';

import { Colors } from '../constants/colors';
import { get, post, del } from '../services/api';
import API_BASE_URL from '../constants/api';
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
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await obtenerTareas();
    setRefreshing(false);
  };

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

  // ============================================
  // ENTREGA DE TAREA (estudiante) — con archivo
  // ============================================
  const [entregaTarea, setEntregaTarea] = useState(null);
  const [archivoEntrega, setArchivoEntrega] = useState(null);
  const [enviandoEntrega, setEnviandoEntrega] = useState(false);

  const abrirModalEntrega = (item) => {
    setEntregaTarea(item);
    setArchivoEntrega(null);
  };

  const cerrarModalEntrega = () => {
    if (enviandoEntrega) return;
    setEntregaTarea(null);
    setArchivoEntrega(null);
  };

  const seleccionarArchivoEntrega = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets?.[0]) {
        setArchivoEntrega(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const enviarEntrega = async () => {
    if (!entregaTarea) return;
    try {
      setEnviandoEntrega(true);

      const formData = new FormData();
      if (archivoEntrega) {
        formData.append('archivo', {
          uri: archivoEntrega.uri,
          name: archivoEntrega.name,
          type: archivoEntrega.mimeType || 'application/octet-stream'
        });
      }

      await post(`/tareas/${entregaTarea.id}/entregar`, formData);
      setEntregaTarea(null);
      setArchivoEntrega(null);
      await obtenerTareas();
    } catch (error) {
      Alert.alert('No se pudo entregar', error.message || 'Intenta de nuevo.');
    } finally {
      setEnviandoEntrega(false);
    }
  };

  const handleEliminar = (id) => {
    Alert.alert(
      "Eliminar Tarea",
      "¿Estás seguro de que deseas eliminar esta tarea?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: async () => {
           try {
             await del(`/tareas/${id}`);
             Alert.alert("Éxito", "Tarea eliminada");
             obtenerTareas();
           } catch (error) {
             Alert.alert("Error", error.message);
           }
        }}
      ]
    );
  };

  const abrirArchivoTarea = async (archivo) => {
    if (!archivo) return;
    const baseUrl = API_BASE_URL.replace('/api', '');
    const url = `${baseUrl}/uploads/${archivo}`;
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir el archivo');
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >

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

              {esDocente && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('SubirTarea', {
                    tarea: item,
                    nombreClase: item.materia || nombreClase
                  })}
                  style={{ marginLeft: 6, padding: 5 }}
                >
                  <Ionicons name="create-outline" size={22} color={Colors.primary} />
                </TouchableOpacity>
              )}

              {esDocente && (
                <TouchableOpacity onPress={() => handleEliminar(item.id)} style={{ marginLeft: 2, padding: 5 }}>
                  <Ionicons name="trash-outline" size={22} color={Colors.error} />
                </TouchableOpacity>
              )}
            </View>

            {!!item.instrucciones && (
              <Text style={[styles.tareaDesc, { color: Colors.onSurfaceVariant }]}>
                {item.instrucciones}
              </Text>
            )}

            {/* Archivo adjunto del docente */}
            {!!item.archivo && (
              <TouchableOpacity
                style={[styles.attachmentRow, { backgroundColor: Colors.surfaceContainerHighest }]}
                onPress={() => abrirArchivoTarea(item.archivo)}
              >
                <MaterialCommunityIcons name="paperclip" size={18} color={Colors.primary} />
                <Text style={[styles.attachmentText, { color: Colors.primary }]} numberOfLines={1}>
                  Archivo del docente
                </Text>
                <MaterialCommunityIcons name="download" size={18} color={Colors.primary} />
              </TouchableOpacity>
            )}

            {/* Archivo entregado por el estudiante */}
            {!esDocente && !!item.archivo_entregado && (
              <TouchableOpacity
                style={[styles.attachmentRow, { backgroundColor: Colors.secondary + '22' }]}
                onPress={() => abrirArchivoTarea(item.archivo_entregado)}
              >
                <MaterialCommunityIcons name="check-circle" size={18} color={Colors.secondary} />
                <Text style={[styles.attachmentText, { color: Colors.secondary }]} numberOfLines={1}>
                  Tu entrega
                </Text>
                <MaterialCommunityIcons name="download" size={18} color={Colors.secondary} />
              </TouchableOpacity>
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
                  onPress={() => abrirModalEntrega(item)}
                >
                  <Text style={[styles.completeBtnText, { color: Colors.secondary }]}>
                    Entregar
                  </Text>
                </TouchableOpacity>
              ) : esDocente ? (
                <TouchableOpacity
                  style={[styles.completeBtn, { borderColor: Colors.primary }]}
                  onPress={() => navigation.navigate('EntregasTarea', { tareaId: item.id, tareaTitulo: item.titulo, claseId })}
                >
                  <Text style={[styles.statusText, { color: Colors.primary }]}>
                    Ver {textoEstado(item)}
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


      {/* ============================== */}
      {/* MODAL: ENTREGA DE TAREA        */}
      {/* ============================== */}
      <Modal
        visible={!!entregaTarea}
        transparent
        animationType="fade"
        onRequestClose={cerrarModalEntrega}
      >
        <View style={modalStyles.backdrop}>
          <View style={[modalStyles.card, { backgroundColor: Colors.surfaceContainerHigh }]}>

            <TouchableOpacity
              style={modalStyles.closeBtn}
              onPress={cerrarModalEntrega}
              hitSlop={10}
            >
              <Ionicons name="close" size={22} color={Colors.onSurface} />
            </TouchableOpacity>

            <View style={[modalStyles.iconCircle, { backgroundColor: Colors.secondary + '22' }]}>
              <MaterialCommunityIcons name="upload" size={28} color={Colors.secondary} />
            </View>

            <Text style={[modalStyles.title, { color: Colors.onSurface }]}>
              Entregar tarea
            </Text>
            <Text style={[modalStyles.subtitle, { color: Colors.onSurfaceVariant }]} numberOfLines={2}>
              {entregaTarea?.titulo}
            </Text>


            {!archivoEntrega ? (
              <TouchableOpacity
                style={[modalStyles.uploadBox, { borderColor: Colors.outlineVariant }]}
                onPress={seleccionarArchivoEntrega}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="cloud-upload-outline" size={40} color={Colors.primary} />
                <Text style={[modalStyles.uploadText, { color: Colors.onSurface }]}>
                  Toca para subir tu archivo
                </Text>
                <Text style={[modalStyles.uploadHint, { color: Colors.onSurfaceVariant }]}>
                  PDF, Word, imagen, etc. (máx 25 MB)
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={[modalStyles.fileChip, { backgroundColor: Colors.surfaceContainerHighest, borderColor: Colors.outlineVariant }]}>
                <MaterialCommunityIcons name="file-document-outline" size={22} color={Colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[modalStyles.fileName, { color: Colors.onSurface }]} numberOfLines={1}>
                    {archivoEntrega.name}
                  </Text>
                  <Text style={{ color: Colors.onSurfaceVariant, fontSize: 11 }}>
                    {archivoEntrega.size ? `${(archivoEntrega.size / 1024).toFixed(1)} KB` : 'Listo para subir'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setArchivoEntrega(null)} hitSlop={10}>
                  <MaterialCommunityIcons name="close-circle" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            )}

            <Text style={[modalStyles.hint, { color: Colors.onSurfaceVariant }]}>
              También puedes entregar sin archivo.
            </Text>


            <TouchableOpacity
              style={[
                modalStyles.submit,
                {
                  backgroundColor: Colors.primary,
                  opacity: enviandoEntrega ? 0.6 : 1
                }
              ]}
              onPress={enviarEntrega}
              disabled={enviandoEntrega}
            >
              {enviandoEntrega
                ? <ActivityIndicator color={Colors.onPrimary} />
                : <Text style={[modalStyles.submitText, { color: Colors.onPrimary }]}>ENTREGAR</Text>
              }
            </TouchableOpacity>

          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 26,
    alignItems: 'center'
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, marginTop: 4
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 22, maxWidth: 280 },
  uploadBox: {
    width: '100%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 22,
    alignItems: 'center'
  },
  uploadText: { fontWeight: '600', marginTop: 8, fontSize: 14 },
  uploadHint: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  fileChip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1
  },
  fileName: { fontWeight: 'bold', fontSize: 14 },
  hint: { fontSize: 11, marginTop: 12, textAlign: 'center' },
  submit: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  submitText: { fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }
});

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

  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10,
    gap: 8
  },
  attachmentText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700'
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
