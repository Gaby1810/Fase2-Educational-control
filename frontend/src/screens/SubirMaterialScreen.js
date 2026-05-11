import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';

import {
  MaterialCommunityIcons,
  Ionicons
} from '@expo/vector-icons';

import * as DocumentPicker from 'expo-document-picker';

import { Colors } from '../constants/colors';
import API_BASE_URL from '../constants/api';

export default function SubirMaterialScreen({ route, navigation }) {

  const { claseId } = route.params;

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    titulo: '',
    descripcion: ''
  });

  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  // =========================
  // SELECCIONAR ARCHIVO
  // =========================
  const seleccionarArchivo = async () => {

    try {

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/*'
        ]
      });

      if (!result.canceled) {
        setArchivoSeleccionado(result.assets[0]);
      }

    } catch (error) {
      Alert.alert("Error", "No se pudo seleccionar el archivo");
    }
  };

  // =========================
  // SUBIR MATERIAL (FIX FINAL)
  // =========================
  const handlePublicar = async () => {

    if (!form.titulo) {
      Alert.alert("Atención", "Debes ingresar un título");
      return;
    }

    if (!archivoSeleccionado) {
      Alert.alert("Atención", "Debes seleccionar un archivo");
      return;
    }

    try {

      setLoading(true);

      const formData = new FormData();

      formData.append('clase_id', claseId);
      formData.append('titulo', form.titulo);
      formData.append('descripcion', form.descripcion);

      formData.append('file', {
        uri: archivoSeleccionado.uri,
        name: archivoSeleccionado.name,
        type: archivoSeleccionado.mimeType || 'application/octet-stream'
      });
      const response = await fetch(
  `${API_BASE_URL}/materiales/subir`, // ❌ sin /api
  {
    method: 'POST',
    body: formData
  }
);

      const text = await response.text();

      console.log("📦 RESPUESTA BACKEND:", text);

      // 🚨 VALIDAR JSON
      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        console.log("❌ NO JSON:", text);
        throw new Error("El backend no devolvió JSON (revisa ruta /api/materiales/subir)");
      }

      // 🚨 ERROR HTTP
      if (!response.ok) {
        throw new Error(data.error || "Error al subir material");
      }

      Alert.alert(
        "Éxito",
        "Material publicado correctamente",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );

    } catch (error) {

      console.log("❌ ERROR:", error.message);

      Alert.alert("Error", error.message);

    } finally {
      setLoading(false);
    }
  };

  return (

    <ScrollView style={[styles.container, {
      backgroundColor: Colors.background
    }]}>

      <View style={styles.header}>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={Colors.onSurface} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, {
          color: Colors.onSurface
        }]}>
          Nuevo Material
        </Text>

        <View style={{ width: 28 }} />

      </View>

      <View style={styles.content}>

        <Text style={[styles.label, { color: Colors.primary }]}>
          Título
        </Text>

        <TextInput
          style={styles.input}
          value={form.titulo}
          onChangeText={(t) => setForm({ ...form, titulo: t })}
        />

        <Text style={[styles.label, { color: Colors.primary }]}>
          Descripción
        </Text>

        <TextInput
          style={[styles.input, { height: 100 }]}
          multiline
          value={form.descripcion}
          onChangeText={(t) => setForm({ ...form, descripcion: t })}
        />

        <TouchableOpacity
          style={styles.uploadArea}
          onPress={seleccionarArchivo}
        >
          <Text>
            {archivoSeleccionado
              ? archivoSeleccionado.name
              : "Seleccionar archivo"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnPublicar}
          onPress={handlePublicar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.btnText}>
              PUBLICAR MATERIAL
            </Text>
          )}
        </TouchableOpacity>

      </View>

    </ScrollView>
  );
}
const styles = StyleSheet.create({

  container: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  content: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
    padding: 15
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 30,
    marginTop: 10,
    alignItems: 'center'
  },
  btnPublicar: {
    marginTop: 40,
    padding: 18,
    backgroundColor: Colors.primary,
    borderRadius: 15,
    alignItems: 'center'
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold'
  }
});