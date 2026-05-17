import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  ScrollView
} from 'react-native';

import {
  Ionicons
} from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import API_BASE_URL from '../constants/api';

export default function
DetalleMaterialScreen({
  navigation,
  route
}) {

  const material =
    route?.params?.material;

  if (!material) {

    return (

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >

        <Text>
          Material no encontrado
        </Text>

      </View>
    );
  }

  // =====================
  // URL PDF
  // =====================

  const archivoURL =
    `${API_BASE_URL.replace('/api', '')}/uploads/${material.archivo}`;

  // =====================
  // ABRIR PDF
  // =====================

  const abrirArchivo =
  async () => {

    try {

      await Linking.openURL(
        archivoURL
      );

    } catch (error) {

      console.log(error);
    }
  };

  return (

    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* ICONO */}
        <View style={[styles.iconBox, { backgroundColor: Colors.surfaceContainerHighest }]}>
          <Ionicons name="document-text" size={70} color={Colors.primary} />
        </View>

        {/* TITULO */}
        <Text style={[styles.title, { color: Colors.onSurface }]}>
          {material.titulo}
        </Text>

        {/* DESCRIPCION */}
        <View style={[styles.card, { backgroundColor: Colors.surfaceContainerLow }]}>
          <Text style={[styles.label, { color: Colors.onSurfaceVariant }]}>Descripción</Text>
          <Text style={[styles.desc, { color: Colors.onSurface }]}>
            {material.descripcion || 'Sin descripción'}
          </Text>
        </View>

        {/* FECHA */}
        <View style={[styles.card, { backgroundColor: Colors.surfaceContainerLow }]}>
          <Text style={[styles.label, { color: Colors.onSurfaceVariant }]}>Fecha publicación</Text>
          <Text style={[styles.desc, { color: Colors.onSurface }]}>
            {material.fecha_publicacion ? new Date(material.fecha_publicacion).toLocaleDateString() : 'Sin fecha'}
          </Text>
        </View>

        {/* BOTON */}
        {material.archivo && (
          <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary }]} onPress={abrirArchivo}>
            <Ionicons name="download-outline" size={24} color={Colors.onPrimary} />
            <Text style={[styles.btnText, { color: Colors.onPrimary }]}>Abrir Archivo</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

    </SafeAreaView>
  );
}

const styles =
StyleSheet.create({

  container: {
    flex: 1
  },
  header: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  iconBox: {
    width: 140,
    height: 140,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 25
  },
  card: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 18
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 10
  },
  desc: {
    fontSize: 16,
    lineHeight: 24
  },
  btn: {
    height: 58,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20
  },
  btnText: {
    fontWeight: 'bold',
    marginLeft: 10
  }

});