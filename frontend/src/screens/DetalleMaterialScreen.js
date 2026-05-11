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

import API_BASE_URL
from '../constants/api';

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

    <SafeAreaView
      style={styles.container}
    >

      {/* HEADER */}

      <View style={styles.header}>

        <TouchableOpacity
          onPress={() =>
            navigation.goBack()
          }
        >

          <Ionicons
            name="chevron-back"
            size={28}
            color="#000"
          />

        </TouchableOpacity>

      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20
        }}
      >

        {/* ICONO */}

        <View style={styles.iconBox}>

          <Ionicons
            name="document-text"
            size={70}
            color="#4F46E5"
          />

        </View>

        {/* TITULO */}

        <Text style={styles.title}>
          {material.titulo}
        </Text>

        {/* DESCRIPCION */}

        <View style={styles.card}>

          <Text style={styles.label}>
            Descripción
          </Text>

          <Text style={styles.desc}>
            {
              material.descripcion ||
              'Sin descripción'
            }
          </Text>

        </View>

        {/* FECHA */}

        <View style={styles.card}>

          <Text style={styles.label}>
            Fecha publicación
          </Text>

          <Text style={styles.desc}>
            {
              material.fecha_publicacion
            }
          </Text>

        </View>

        {/* BOTON */}

        {
          material.archivo && (

            <TouchableOpacity
              style={styles.btn}
              onPress={abrirArchivo}
            >

              <Ionicons
                name="download-outline"
                size={24}
                color="#FFF"
              />

              <Text style={styles.btnText}>
                Abrir Archivo
              </Text>

            </TouchableOpacity>
          )
        }

      </ScrollView>

    </SafeAreaView>
  );
}

const styles =
StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F7FB'
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
    backgroundColor: '#EEF2FF',
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
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 18,
    marginBottom: 18
  },

  label: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666'
  },

  desc: {
    fontSize: 16,
    lineHeight: 24
  },

  btn: {
    height: 58,
    backgroundColor: '#4F46E5',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 20
  },

  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 10
  }

});