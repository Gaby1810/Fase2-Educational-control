import React from 'react';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView
} from 'react-native';

import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function DetalleClaseScreen({ navigation, route }) {

  const clase = route?.params?.clase;

  if (!clase) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No se recibió la clase</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 15 }}>

        <Text style={styles.title}>{clase.nombre}</Text>

        <View style={styles.infoCard}>
          <Text>Código:</Text>
          <Text>{clase.codigo_clase}</Text>
        </View>

        {/* 🔥 BOTÓN MATERIALES CORRECTO */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() =>
            navigation.navigate('Materiales', {
              claseId: clase.id,
              nombreClase: clase.nombre
            })
          }
        >
          <FontAwesome5 name="chalkboard" size={20} color="#FFF" />
          <Text style={{ color: '#fff', marginLeft: 10 }}>Materiales</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 100, backgroundColor: '#0D2A73' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  infoCard: { padding: 15, backgroundColor: '#fff', marginVertical: 10 },
  optionCard: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#3B8EEA',
    borderRadius: 10,
    marginTop: 20
  }
});