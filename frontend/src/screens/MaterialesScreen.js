import React, { useState, useEffect } from 'react';

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';

import {
  MaterialCommunityIcons,
  Ionicons
} from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import API_BASE_URL from '../constants/api';

export default function MaterialesScreen({ route, navigation }) {

  const claseId = route?.params?.claseId;
  const nombreClase = route?.params?.nombreClase || "Materiales";

  const [materiales, setMateriales] = useState([]);
  const [loading, setLoading] = useState(true);

 const obtenerMateriales = async () => {

  try {

    setLoading(true);

   const url = `${API_BASE_URL}/materiales?clase_id=${claseId}`;

    console.log("🌐 URL:", url);

    const response = await fetch(url);

    const text = await response.text();

    console.log("📦 RAW RESPONSE:", text);
    console.log("STATUS:", response.status);

    // ❌ SI NO ES JSON LO DETECTAMOS CLARO
    if (!text || text.startsWith("<")) {
      throw new Error("Backend está devolviendo HTML (error o ruta no existe)");
    }

    const data = JSON.parse(text);

    setMateriales(data);

  } catch (error) {
    console.log("❌ ERROR REAL:", error.message);
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    obtenerMateriales();
  }, []);

  // =========================================
  // ICONO ARCHIVO
  // =========================================
  const obtenerIcono = (archivo) => {

    if (!archivo) return "file-outline";
    if (archivo.includes(".pdf")) return "file-pdf-box";
    if (archivo.includes(".doc") || archivo.includes(".docx")) return "file-word";
    if (archivo.includes(".png") || archivo.includes(".jpg") || archivo.includes(".jpeg")) return "file-image";

    return "file";
  };

  // =========================================
  // UI
  // =========================================
  return (

    <SafeAreaView style={[styles.container, {
      backgroundColor: Colors.background
    }]}>

      {/* HEADER */}
      <View style={[styles.header, {
        backgroundColor: Colors.surfaceContainerHighest
      }]}>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, {
          color: Colors.onSurface
        }]}>
          {nombreClase}
        </Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('SubirMaterial', { claseId })}
        >
          <Ionicons name="add-circle" size={30} color={Colors.primary} />
        </TouchableOpacity>

      </View>

      {/* CONTENIDO */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        <Text style={[styles.sectionTitle, {
          color: Colors.onSurfaceVariant
        }]}>
          Materiales publicados
        </Text>

        {/* LOADING */}
        {loading && (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="loading"
              size={70}
              color={Colors.primary}
            />
            <Text style={styles.emptyText}>
              Cargando materiales...
            </Text>
          </View>
        )}

        {/* VACÍO */}
        {!loading && materiales.length === 0 && (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="folder-open-outline"
              size={70}
              color="#AAA"
            />
            <Text style={styles.emptyText}>
              No hay materiales publicados
            </Text>
          </View>
        )}

        {/* LISTA */}
        {materiales.map((item) => (
          <View
            key={item.id}
            style={[styles.materialCard, {
              backgroundColor: Colors.surfaceContainerLow
            }]}
          >

            <View style={styles.row}>

              <View style={styles.fileIconBox}>
                <MaterialCommunityIcons
                  name={obtenerIcono(item.archivo)}
                  size={35}
                  color={Colors.primary}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>

                <Text style={[styles.materialTitle, {
                  color: Colors.onSurface
                }]}>
                  {item.titulo}
                </Text>

                <Text style={styles.materialDate}>
                  Publicado:{" "}
                  {item.fecha_publicacion
                    ? new Date(item.fecha_publicacion).toLocaleDateString()
                    : "Sin fecha"}
                </Text>

              </View>

            </View>

          </View>
        ))}

      </ScrollView>

    </SafeAreaView>
  );
}

// =========================
// ESTILOS
// =========================
const styles = StyleSheet.create({

  container: { flex: 1 },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15
  },

  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },

  emptyBox: {
    alignItems: 'center',
    marginTop: 60
  },

  emptyText: {
    marginTop: 15,
    color: '#777',
    fontSize: 16
  },

  materialCard: {
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    elevation: 2
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  fileIconBox: {
    width: 55,
    height: 55,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2FF'
  },

  materialTitle: {
    fontWeight: 'bold',
    fontSize: 15
  },

  materialDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 4
  }

});