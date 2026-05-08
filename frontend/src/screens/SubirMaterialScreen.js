import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker'; // 👈 Importación necesaria
import { Colors } from '../constants/colors';
import { post } from '../services/api';

export default function SubirMaterialScreen({ route, navigation }) {
  const { claseId } = route.params;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ titulo: '', descripcion: '' });
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  const seleccionarArchivo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setArchivoSeleccionado(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo acceder al selector de archivos");
    }
  };

  const handlePublicar = async () => {
    if (!form.titulo || !archivoSeleccionado) {
      Alert.alert("Atención", "Debes ingresar un título y seleccionar un archivo.");
      return;
    }

    setLoading(true);

    try {
      
      const formData = new FormData();
      formData.append('clase_id', claseId);
      formData.append('titulo', form.titulo);
      formData.append('descripcion', form.descripcion);
      formData.append('file', {
        uri: archivoSeleccionado.uri,
        name: archivoSeleccionado.name,
        type: archivoSeleccionado.mimeType || 'application/octet-stream',
      });

      await post('/materiales/subir', formData, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });

      Alert.alert("¡Éxito!", "Material publicado correctamente", [
        { text: "Excelente", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Error", "No se pudo subir el archivo al servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.onSurface }]}>Nuevo Material</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, { color: Colors.primary }]}>Título del Material</Text>
        <TextInput 
          style={[styles.input, { backgroundColor: Colors.surfaceContainerLow, color: Colors.onSurface }]} 
          placeholder="Nombre del recurso..." 
          placeholderTextColor="#666"
          onChangeText={(t) => setForm({...form, titulo: t})}
        />

        <Text style={[styles.label, { color: Colors.primary }]}>Archivo Adjunto</Text>
        <TouchableOpacity 
          style={[
            styles.uploadArea, 
            { borderColor: archivoSeleccionado ? Colors.primary : Colors.outlineVariant }
          ]} 
          onPress={seleccionarArchivo}
        >
          <View style={[styles.iconCircle, { backgroundColor: archivoSeleccionado ? Colors.primary : Colors.primaryContainer }]}>
            <MaterialCommunityIcons 
              name={archivoSeleccionado ? "file-check" : "cloud-upload-outline"} 
              size={32} 
              color={archivoSeleccionado ? Colors.onPrimary : Colors.onPrimaryContainer} 
            />
          </View>
          <Text style={[styles.uploadText, { color: Colors.onSurface }]}>
            {archivoSeleccionado ? archivoSeleccionado.name : "Haz clic para seleccionar"}
          </Text>
          {archivoSeleccionado && (
            <Text style={{ color: Colors.primary, fontSize: 12 }}>
              {(archivoSeleccionado.size / (1024 * 1024)).toFixed(2)} MB
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.btnPublicar, { backgroundColor: Colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handlePublicar}
          disabled={loading}
        >
          <Text style={[styles.btnText, { color: Colors.onPrimary }]}>
            {loading ? "Subiendo..." : "PUBLICAR AHORA"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, marginTop: 20 },
  input: { borderRadius: 12, padding: 15, fontSize: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  uploadArea: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 20, padding: 30, alignItems: 'center', marginTop: 5 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  uploadText: { fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  btnPublicar: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 40, elevation: 4 },
  btnText: { fontWeight: 'bold', fontSize: 16 }
});