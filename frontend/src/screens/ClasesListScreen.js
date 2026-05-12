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
  Alert
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { get, post } from '../services/api';

import { Colors } from '../constants/colors';

import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function ClasesListScreen({ navigation }) {

  const { usuario } = useAuth();

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clases, setClases] = useState([]);

  const [form, setForm] = useState({
    nombre: '',
    grado: '',
    seccion: ''
  });

  useEffect(() => {
    cargarClases();
  }, []);

  const cargarClases = async () => {
    try {
      const data = await get("/clases");
      setClases(data);
    } catch (error) {
      console.log("Error al obtener clases:", error);
    }
  };
  // =====================================
  // CREAR CLASE
  // =====================================

  const handleCrearClase = async () => {

    if (!form.nombre || !form.grado) {

      Alert.alert(
        "Campos incompletos",
        "Completa nombre y grado"
      );

      return;
    }

    try {

      const res =
        await post(
          "/clases/crear",
          form
        );

      Alert.alert(
        "Clase creada",
        `Código: ${res.codigo_clase}`
      );

      const nuevaClase = {
        id: res.id,
        nombre: form.nombre,
        grado: form.grado,
        seccion: form.seccion,
        codigo_clase: res.codigo_clase
      };

      setMostrarFormulario(false);

      setForm({
        nombre: '',
        grado: '',
        seccion: ''
      });

      cargarClases();

      // NAVEGAR
      navigation.navigate(
        "DetalleClase",
        {
          clase: nuevaClase
        }
      );

    } catch (error) {

      Alert.alert(
        "Error",
        error.message
      );
    }
  };


  return (

    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            Colors.background
        }
      ]}
    >

      <StatusBar barStyle="light-content" />

      {/* HEADER */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              Colors.surfaceContainerHighest
          }
        ]}
      >

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() =>
            navigation.goBack()
          }
        >

          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.primary}
          />

        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color:
                Colors.onSurface
            }
          ]}
        >
          Educational Control
        </Text>

        <View style={{ width: 35 }} />

      </View>


      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
      >

        {/* TITULO */}

        <View style={styles.titleRow}>

          <Text
            style={[
              styles.title,
              {
                color:
                  Colors.onSurface
              }
            ]}
          >
            Clases
          </Text>

          <TouchableOpacity
            style={styles.addBtnAction}
            onPress={() =>
              setMostrarFormulario(
                !mostrarFormulario
              )
            }
          >

            <Text
              style={{
                color: Colors.primary,
                marginRight: 8,
                fontWeight: '600'
              }}
            >
              Crear
            </Text>

            <Ionicons
              name="add-circle"
              size={32}
              color={Colors.primary}
            />

          </TouchableOpacity>

        </View>


        {/* FORMULARIO */}

        {mostrarFormulario && (

          <View
            style={[
              styles.cardForm,
              {
                backgroundColor:
                  Colors.surfaceContainerLow
              }
            ]}
          >

            <Text style={styles.label}>
              Nombre clase
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Matemáticas"
              value={form.nombre}
              onChangeText={(t) =>
                setForm({
                  ...form,
                  nombre: t
                })
              }
            />

            <Text style={styles.label}>
              Grado
            </Text>

            <TextInput
              style={styles.input}
              placeholder="9°"
              value={form.grado}
              onChangeText={(t) =>
                setForm({
                  ...form,
                  grado: t
                })
              }
            />

            <Text style={styles.label}>
              Sección
            </Text>

            <TextInput
              style={styles.input}
              placeholder="A"
              value={form.seccion}
              onChangeText={(t) =>
                setForm({
                  ...form,
                  seccion: t
                })
              }
            />

            <TouchableOpacity
              style={styles.btnSave}
              onPress={handleCrearClase}
            >

              <Text style={styles.btnText}>
                PUBLICAR CLASE
              </Text>

            </TouchableOpacity>

          </View>
        )}


        {/* VACIO */}

        {clases.length === 0 && (

          <View style={styles.emptyView}>

            <Image
              source={{
                uri:
                  'https://img.freepik.com/free-vector/online-learning-concept-illustration_114360-1105.jpg'
              }}
              style={styles.image}
            />

            <Text style={styles.emptyText}>
              No hay clases creadas
            </Text>

          </View>
        )}


        {/* LISTA */}

        {clases.map((item) => (

          <TouchableOpacity
            key={item.id}
            style={styles.claseCard}

            onPress={() =>
              navigation.navigate(
                "DetalleClase",
                {
                  clase: item
                }
              )
            }
          >

            <Image
              source={{
                uri:
                  'https://img.freepik.com/free-vector/workspace-concept-illustration_114360-639.jpg'
              }}
              style={styles.cardBanner}
            />

            <View style={styles.cardBody}>

              <View>

                <Text style={styles.cardTitle}>
                  {item.nombre}
                </Text>

                <Text style={styles.cardSub}>
                  {item.grado}
                  {" "}
                  Sección {item.seccion}
                </Text>

                <Text style={styles.codigo}>
                  {item.codigo_clase}
                </Text>

              </View>

              <View style={styles.verClaseBadge}>

                <Text
                  style={{
                    color: Colors.primary,
                    fontWeight: 'bold'
                  }}
                >
                  Ver más
                </Text>

              </View>

            </View>

          </TouchableOpacity>

        ))}

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1
  },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },

  headerBtn: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center'
  },

  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16
  },

  scrollContent: {
    padding: 20
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold'
  },

  addBtnAction: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  cardForm: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 25
  },

  label: {
    marginBottom: 8,
    fontWeight: 'bold'
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFF'
  },

  btnSave: {
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4F46E5'
  },

  btnText: {
    color: '#FFF',
    fontWeight: 'bold'
  },

  emptyView: {
    alignItems: 'center',
    marginTop: 50
  },

  image: {
    width: width * 0.7,
    height: width * 0.7
  },

  emptyText: {
    marginTop: 15,
    color: '#666',
    fontSize: 16
  },

  claseCard: {
    borderRadius: 18,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    elevation: 4
  },

  cardBanner: {
    width: '100%',
    height: 130
  },

  cardBody: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },

  cardSub: {
    marginTop: 4,
    color: '#666'
  },

  codigo: {
    marginTop: 8,
    fontWeight: 'bold',
    color: '#4F46E5'
  },

  verClaseBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EEF2FF'
  }

});