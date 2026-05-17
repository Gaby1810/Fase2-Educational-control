import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, SafeAreaView, Alert, Platform 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { Colors } from '../constants/colors';
import { post, put } from '../services/api';

export default function SubirTareaScreen({ route, navigation }) {
  const claseId = route?.params?.claseId;
  const nombreClase = route?.params?.nombreClase || 'la clase';

  // Si llega una tarea por params → modo edición
  const tareaEditar = route?.params?.tarea || null;
  const esEdicion = !!tareaEditar;

  const [titulo, setTitulo] = useState(tareaEditar?.titulo || '');
  const [descripcion, setDescripcion] = useState(tareaEditar?.instrucciones || '');
  const [fecha, setFecha] = useState(
    tareaEditar?.fecha_entrega ? new Date(tareaEditar.fecha_entrega) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPublicado, setIsPublicado] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [archivo, setArchivo] = useState(null);

  const seleccionarArchivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets?.[0]) {
        setArchivo(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const quitarArchivo = () => setArchivo(null);

  useEffect(() => {
    if (isPublicado) {
      const timer = setTimeout(() => {
        setIsPublicado(false);
        navigation.goBack();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isPublicado]);

  const handlePublicar = async () => {
    if (!esEdicion && !claseId) {
      Alert.alert("Clase no encontrada", "Regresa a la clase e intenta crear la tarea nuevamente.");
      return;
    }

    if (publicando) return;
    
    if (!titulo.trim()) {
      Alert.alert("Campo Requerido", "Por favor ingresa un título para la tarea.");
      return;
    }
    if (!descripcion.trim()) {
      Alert.alert("Campo Requerido", "Debes añadir una descripción o instrucciones.");
      return;
    }

    try {
      setPublicando(true);

      if (esEdicion) {
        // EDITAR: se envía JSON (no se cambia el archivo aquí)
        await put(`/tareas/${tareaEditar.id}`, {
          titulo: titulo.trim(),
          instrucciones: descripcion.trim(),
          fecha_entrega: fecha.toISOString().split('T')[0]
        });
      } else {
        // CREAR: FormData para poder adjuntar archivo
        const formData = new FormData();
        formData.append('clase_id', String(claseId));
        formData.append('titulo', titulo.trim());
        formData.append('instrucciones', descripcion.trim());
        formData.append('fecha_entrega', fecha.toISOString().split('T')[0]);

        if (archivo) {
          formData.append('archivo', {
            uri: archivo.uri,
            name: archivo.name,
            type: archivo.mimeType || 'application/octet-stream'
          });
        }

        await post('/tareas/crear', formData);
      }

      setIsPublicado(true);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo guardar la tarea.");
    } finally {
      setPublicando(false);
    }
  };

  const onChangeFecha = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setFecha(selectedDate);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={Colors.onSurface} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: Colors.onSurface }]}>
            {esEdicion ? 'Editar Tarea' : 'Nueva Tarea'}
          </Text>
          <Text style={[styles.headerSub, { color: Colors.onSurfaceVariant }]} numberOfLines={1}>
            {nombreClase}
          </Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: Colors.primary }]}>Título de la tarea *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: Colors.surfaceContainerLow, color: Colors.onSurface, borderColor: Colors.outlineVariant }]}
            placeholder="Ej: Ensayo sobre el modernismo"
            placeholderTextColor="#666"
            value={titulo}
            onChangeText={setTitulo}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: Colors.primary }]}>Fecha de entrega *</Text>
          <TouchableOpacity 
            style={[styles.datePickerSelector, { backgroundColor: Colors.surfaceContainerLow, borderColor: Colors.outlineVariant }]} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: Colors.onSurface }}>{fecha.toLocaleDateString()}</Text>
            <MaterialCommunityIcons name="calendar-month" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onChangeFecha}
            minimumDate={esEdicion ? undefined : new Date()}
          />
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: Colors.primary }]}>Descripción / Instrucciones</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: Colors.surfaceContainerLow, color: Colors.onSurface, borderColor: Colors.outlineVariant }]}
            multiline
            placeholder="Escribe los pasos a seguir para la tarea..."
            placeholderTextColor="#666"
            value={descripcion}
            onChangeText={setDescripcion}
          />
        </View>

        {!esEdicion && (
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: Colors.primary }]}>Archivo adjunto (opcional)</Text>

          {!archivo ? (
            <TouchableOpacity
              style={[styles.uploadBox, { borderColor: Colors.outlineVariant }]}
              onPress={seleccionarArchivo}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cloud-upload-outline" size={44} color={Colors.primary} />
              <Text style={[styles.uploadText, { color: Colors.onSurface }]}>
                Toca para subir un archivo
              </Text>
              <Text style={[styles.uploadHint, { color: Colors.onSurfaceVariant }]}>
                PDF, Word, imágenes, etc. (máx 25 MB)
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.fileChip, { backgroundColor: Colors.surfaceContainerLow, borderColor: Colors.outlineVariant }]}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color={Colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.fileName, { color: Colors.onSurface }]} numberOfLines={1}>
                  {archivo.name}
                </Text>
                <Text style={{ color: Colors.onSurfaceVariant, fontSize: 11 }}>
                  {archivo.size ? `${(archivo.size / 1024).toFixed(1)} KB` : 'Archivo seleccionado'}
                </Text>
              </View>
              <TouchableOpacity onPress={quitarArchivo} hitSlop={10}>
                <MaterialCommunityIcons name="close-circle" size={22} color={Colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        )}

        <TouchableOpacity
          style={[styles.btnPrimary, { backgroundColor: Colors.primary, opacity: publicando ? 0.65 : 1 }]}
          onPress={handlePublicar}
          disabled={publicando}
        >
          <Text style={[styles.btnText, { color: Colors.onPrimary }]}>
            {publicando
              ? (esEdicion ? 'GUARDANDO...' : 'PUBLICANDO...')
              : (esEdicion ? 'GUARDAR CAMBIOS' : 'PUBLICAR TAREA')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Alerta de Éxito Flotante */}
      {isPublicado && (
        <View style={[styles.successToast, { backgroundColor: Colors.surfaceContainerHighest }]}>
          <MaterialCommunityIcons name="check-circle" size={28} color="#4CAF50" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.successTitle, { color: Colors.onSurface }]}>
              {esEdicion ? '¡Actualizada!' : '¡Publicado!'}
            </Text>
            <Text style={{ color: Colors.onSurfaceVariant, fontSize: 12 }}>
              {esEdicion ? 'Los cambios se guardaron.' : 'La tarea ya está disponible.'}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  headerSub: { fontSize: 11, marginTop: 2, maxWidth: 220 },
  scrollContent: { padding: 25 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 16 },
  textArea: { height: 150, textAlignVertical: 'top' },
  datePickerSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 15 },
  btnPrimary: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20, elevation: 4 },
  btnText: { fontWeight: 'bold', fontSize: 16 },
  successToast: { position: 'absolute', bottom: 40, left: 20, right: 20, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 10, borderLeftWidth: 6, borderLeftColor: '#4CAF50' },
  successTitle: { fontWeight: 'bold', fontSize: 15 },
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 22,
    alignItems: 'center'
  },
  uploadText: { fontWeight: '600', marginTop: 8, fontSize: 14 },
  uploadHint: { fontSize: 11, marginTop: 4 },
  fileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1
  },
  fileName: { fontWeight: 'bold', fontSize: 14 }
});
