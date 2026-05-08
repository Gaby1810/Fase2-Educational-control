import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, SafeAreaView, Alert, Platform 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../constants/colors';
import { post } from '../services/api';

export default function SubirTareaScreen({ route, navigation }) {
  const { claseId } = route.params;
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPublicado, setIsPublicado] = useState(false);

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
    
    if (!titulo.trim()) {
      Alert.alert("Campo Requerido", "Por favor ingresa un título para la tarea.");
      return;
    }
    if (!descripcion.trim()) {
      Alert.alert("Campo Requerido", "Debes añadir una descripción o instrucciones.");
      return;
    }

    try {
      const data = {
        clase_id: claseId,
        titulo: titulo,
        descripcion: descripcion,
        fecha_entrega: fecha.toISOString().split('T')[0], // Formato YYYY-MM-DD
      };

      await post('/tareas/crear', data);
      setIsPublicado(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor.");
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
        <Text style={[styles.headerTitle, { color: Colors.onSurface }]}>Nueva Tarea</Text>
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
            minimumDate={new Date()}
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

        <TouchableOpacity 
          style={[styles.btnPrimary, { backgroundColor: Colors.primary }]} 
          onPress={handlePublicar}
        >
          <Text style={[styles.btnText, { color: Colors.onPrimary }]}>PUBLICAR TAREA</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Alerta de Éxito Flotante */}
      {isPublicado && (
        <View style={[styles.successToast, { backgroundColor: Colors.surfaceContainerHighest }]}>
          <MaterialCommunityIcons name="check-circle" size={28} color="#4CAF50" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.successTitle, { color: Colors.onSurface }]}>¡Publicado!</Text>
            <Text style={{ color: Colors.onSurfaceVariant, fontSize: 12 }}>La tarea ya está disponible.</Text>
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
  scrollContent: { padding: 25 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 15, fontSize: 16 },
  textArea: { height: 150, textAlignVertical: 'top' },
  datePickerSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 15 },
  btnPrimary: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20, elevation: 4 },
  btnText: { fontWeight: 'bold', fontSize: 16 },
  successToast: { position: 'absolute', bottom: 40, left: 20, right: 20, padding: 15, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 10, borderLeftWidth: 6, borderLeftColor: '#4CAF50' },
  successTitle: { fontWeight: 'bold', fontSize: 15 }
});