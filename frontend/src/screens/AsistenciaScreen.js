import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, SafeAreaView, Alert } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { post } from '../services/api';

export default function AsistenciaScreen({ route, navigation }) {
  const { claseId, nombreClase } = route.params || {};
  const [asistencia, setAsistencia] = useState({});
  const [loading, setLoading] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);

  const estudiantes = [
    { id: '40129', nombre: 'Alonzo, Ricardo', foto: 'https://i.pravatar.cc/150?u=11' },
    { id: '40150', nombre: 'Benitez, Lucía', foto: 'https://i.pravatar.cc/150?u=12' },
    { id: '40151', nombre: 'Castillo, Jorge', foto: 'https://i.pravatar.cc/150?u=13' },
    { id: '40152', nombre: 'Diaz, Martina', foto: 'https://i.pravatar.cc/150?u=14' },
    { id: '40153', nombre: 'Espinoza, Luis', foto: 'https://i.pravatar.cc/150?u=15' },
  ];

  const marcarAsistencia = (estudianteId, estado) => {
    setAsistencia({ ...asistencia, [estudianteId]: estado });
  };

  const totales = Object.values(asistencia).reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, { P: 0, A: 0, T: 0 });

  const handleGuardar = async () => {
    if (Object.keys(asistencia).length < estudiantes.length) {
      Alert.alert("Incompleto", "Por favor, marca la asistencia de todos los alumnos.");
      return;
    }

    setLoading(true);
    try {
      const registro = {
        clase_id: claseId,
        fecha: new Date().toISOString().split('T')[0],
        datos: asistencia 
      };

      await post('/asistencia/guardar', registro);
      setMostrarExito(true);
      
      setTimeout(() => {
        setMostrarExito(false);
        navigation.goBack();
      }, 2500);

    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el registro de asistencia.");
    } finally {
      setLoading(false);
    }
  };

  const fechaHoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: Colors.surfaceContainerHighest }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.onSurface }]}>Tomar Asistencia</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* TOAST DE ÉXITO */}
        {mostrarExito && (
          <View style={[styles.successToast, { backgroundColor: Colors.surfaceContainerHigh }]}>
            <MaterialCommunityIcons name="check-circle" size={24} color={Colors.primary} />
            <Text style={[styles.successTitle, { color: Colors.onSurface }]}>Asistencia guardada correctamente</Text>
          </View>
        )}

        <Text style={[styles.dateLabel, { color: Colors.primary }]}>{fechaHoy}</Text>

        {/* RESUMEN DE TOTALES */}
        <View style={styles.summaryContainer}>
          <SummaryBox label="PRESENTE" value={totales.P} color={Colors.primary} />
          <SummaryBox label="AUSENTE" value={totales.A} color={Colors.error} />
          <SummaryBox label="TARDANZA" value={totales.T} color={Colors.tertiary} />
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: Colors.onSurfaceVariant }]}>
            LISTA DE ESTUDIANTES ({estudiantes.length})
          </Text>
        </View>

        {/* LISTA DE ESTUDIANTES */}
        {estudiantes.map((est) => (
          <View key={est.id} style={[styles.studentItem, { backgroundColor: Colors.surfaceContainerLow }]}>
            <Image source={{ uri: est.foto }} style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.studentName, { color: Colors.onSurface }]}>{est.nombre}</Text>
              <Text style={[styles.studentId, { color: Colors.onSurfaceVariant }]}>ID: {est.id}</Text>
            </View>
            
            <View style={styles.optionsRow}>
              <OptionBtn 
                label="P" 
                active={asistencia[est.id] === 'P'} 
                activeColor={Colors.primary} 
                onPress={() => marcarAsistencia(est.id, 'P')} 
              />
              <OptionBtn 
                label="A" 
                active={asistencia[est.id] === 'A'} 
                activeColor={Colors.error} 
                onPress={() => marcarAsistencia(est.id, 'A')} 
              />
              <OptionBtn 
                label="T" 
                active={asistencia[est.id] === 'T'} 
                activeColor={Colors.tertiary} 
                onPress={() => marcarAsistencia(est.id, 'T')} 
              />
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={[styles.btnSave, { backgroundColor: Colors.primary, opacity: loading ? 0.7 : 1 }]} 
          onPress={handleGuardar}
          disabled={loading}
        >
          <MaterialCommunityIcons name="content-save-check" size={22} color={Colors.onPrimary} />
          <Text style={[styles.btnSaveText, { color: Colors.onPrimary }]}>
            {loading ? "Guardando..." : "Finalizar Asistencia"}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const SummaryBox = ({ label, value, color }) => (
  <View style={[styles.summaryBox, { backgroundColor: Colors.surfaceContainerLow }]}>
    <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    <Text style={[styles.summaryValue, { color: Colors.onSurface }]}>{value}</Text>
  </View>
);

const OptionBtn = ({ label, active, activeColor, onPress }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={[
      styles.optionCircle, 
      { borderColor: Colors.outlineVariant, backgroundColor: Colors.surfaceContainerHighest },
      active && { backgroundColor: activeColor, borderColor: activeColor }
    ]}
  >
    <Text style={[styles.optionText, { color: Colors.onSurfaceVariant }, active && { color: 'white' }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  headerTitle: { fontWeight: 'bold', fontSize: 16 },
  scrollContent: { padding: 20 },
  dateLabel: { textAlign: 'center', fontSize: 11, fontWeight: 'bold', marginBottom: 15 },
  summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  summaryBox: { width: '31%', padding: 12, borderRadius: 16, alignItems: 'center', elevation: 2 },
  summaryLabel: { fontSize: 9, fontWeight: 'bold', marginBottom: 4 },
  summaryValue: { fontSize: 22, fontWeight: 'bold' },
  listHeader: { marginBottom: 15 },
  listTitle: { fontSize: 12, fontWeight: 'bold' },
  studentItem: { flexDirection: 'row', padding: 12, borderRadius: 16, marginBottom: 10, alignItems: 'center', elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333' },
  studentName: { fontWeight: 'bold', fontSize: 14 },
  studentId: { fontSize: 10 },
  optionsRow: { flexDirection: 'row', gap: 6 },
  optionCircle: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  optionText: { fontSize: 13, fontWeight: 'bold' },
  btnSave: { flexDirection: 'row', padding: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 25, elevation: 4 },
  btnSaveText: { fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
  successToast: { padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#4A90E2' },
  successTitle: { fontWeight: 'bold', fontSize: 13, marginLeft: 10 }
});