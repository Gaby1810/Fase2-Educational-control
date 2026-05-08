import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { post } from '../services/api'; 
import { Colors } from '../constants/colors';
import API_BASE_URL from '../constants/api';

const { width } = Dimensions.get('window');

export default function ClasesListScreen({ navigation }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clases, setClases] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [form, setForm] = useState({
    nombre: '',
    grado: '',
    seccion: '',
    docente_id: 1 
  });

  const cargarClases = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clases`);
      const data = await response.json();
      setClases(data);
    } catch (error) {
      console.error("Error al obtener clases:", error);
    }
  };

  useEffect(() => {
    cargarClases();
  }, []);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleCrearClase = async () => {
    if (!form.nombre || !form.grado) {
      Alert.alert("Campos incompletos", "El nombre y el grado son obligatorios.");
      return;
    }

    try {
      const res = await post("/clases/crear", form);
      setShowSuccess(true);
      setMostrarFormulario(false);
      setForm({ nombre: '', grado: '', seccion: '', docente_id: 1 });
      cargarClases(); 
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity 
          style={styles.headerBtn} 
          onPress={() => mostrarFormulario ? setMostrarFormulario(false) : navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.onSurface }]}>Educational Control</Text>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* ALERTA DE ÉXITO */}
      {showSuccess && (
        <View style={styles.successAlert}>
          <View style={styles.alertLeft}>
            <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.alertTitle}>Éxito</Text>
              <Text style={styles.alertSub}>Clase creada correctamente</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowSuccess(false)}>
            <Ionicons name="close" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* TÍTULO Y BOTÓN DE ACCIÓN */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: Colors.onSurface }]}>Clases</Text>
          {!mostrarFormulario && (
            <TouchableOpacity style={styles.addBtnAction} onPress={() => setMostrarFormulario(true)}>
              <Text style={{ color: Colors.primary, marginRight: 8, fontWeight: '600' }}>Crea una clase</Text>
              <Ionicons name="add-circle" size={32} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {mostrarFormulario ? (
          /* VISTA: FORMULARIO */
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={[styles.cardForm, { backgroundColor: Colors.surfaceContainerLow }]}>
              <Text style={[styles.label, { color: Colors.primary }]}>Nombre de la clase *</Text>
              <TextInput 
                style={[styles.input, { borderColor: Colors.outlineVariant, color: Colors.onSurface }]}
                placeholder="Ej: Matemáticas"
                placeholderTextColor="#555"
                onChangeText={(t) => setForm({...form, nombre: t})}
              />
              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: Colors.primary }]}>Grado *</Text>
                  <TextInput style={[styles.input, { borderColor: Colors.outlineVariant, color: Colors.onSurface }]} placeholder="10mo" placeholderTextColor="#555" onChangeText={(t) => setForm({...form, grado: t})} />
                </View>
                <View style={{ width: 15 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: Colors.primary }]}>Sección</Text>
                  <TextInput style={[styles.input, { borderColor: Colors.outlineVariant, color: Colors.onSurface }]} placeholder="A" placeholderTextColor="#555" onChangeText={(t) => setForm({...form, seccion: t})} />
                </View>
              </View>
              <TouchableOpacity style={[styles.btnSave, { backgroundColor: Colors.primary }]} onPress={handleCrearClase}>
                <Text style={{ color: Colors.onPrimary, fontWeight: 'bold' }}>PUBLICAR CLASE</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : clases.length === 0 ? (
          /* VISTA: ESTADO VACÍO */
          <View style={styles.emptyView}>
            <Image source={{ uri: 'https://img.freepik.com/free-vector/online-learning-concept-illustration_114360-1105.jpg' }} style={styles.image} resizeMode="contain" />
            <Text style={[styles.emptyText, { color: Colors.onSurfaceVariant }]}>Crea una clase nueva</Text>
          </View>
        ) : (
          /* VISTA: LISTADO DE CLASES */
          clases.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.claseCard, { backgroundColor: Colors.surfaceContainerLow }]}
              onPress={() => navigation.navigate('DetalleMateria', { clase: item })}
            >
              <Image source={{ uri: 'https://img.freepik.com/free-vector/workspace-concept-illustration_114360-639.jpg' }} style={styles.cardBanner} />
              <View style={styles.cardBody}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: Colors.onSurface }]}>{item.nombre}</Text>
                  <Text style={{ color: Colors.onSurfaceVariant, fontSize: 12 }}>{item.grado} Sección "{item.seccion || 'N/A'}"</Text>
                </View>
                <View style={styles.verClaseBadge}>
                  <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: 'bold' }}>Ver clase</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerBtn: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  scrollContent: { padding: 25 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 30, fontWeight: 'bold' },
  addBtnAction: { flexDirection: 'row', alignItems: 'center' },
  successAlert: { position: 'absolute', top: 70, left: 20, right: 20, zIndex: 100, flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'space-between', elevation: 10, borderLeftWidth: 5, borderLeftColor: '#27AE60' },
  alertLeft: { flexDirection: 'row', alignItems: 'center' },
  alertTitle: { fontWeight: 'bold', color: '#333' },
  alertSub: { fontSize: 12, color: '#666' },
  emptyView: { alignItems: 'center', marginTop: 40 },
  image: { width: width * 0.7, height: width * 0.7 },
  emptyText: { fontSize: 16, marginTop: 10 },
  cardForm: { padding: 20, borderRadius: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 15, marginBottom: 15 },
  rowInputs: { flexDirection: 'row' },
  btnSave: { height: 55, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  claseCard: { borderRadius: 16, marginBottom: 20, overflow: 'hidden', elevation: 3 },
  cardBanner: { width: '100%', height: 120 },
  cardBody: { padding: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 18, fontWeight: 'bold' },
  verClaseBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(203, 214, 255, 0.2)' }
});