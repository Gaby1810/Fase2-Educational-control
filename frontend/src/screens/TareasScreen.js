import React, { useState, useEffect } from 'react';

import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';

import {
  MaterialCommunityIcons,
  Ionicons
} from '@expo/vector-icons';

import { Colors } from '../constants/colors';

import API_BASE_URL from '../constants/api';

export default function TareasScreen({
  route,
  navigation
}) {

  // =========================================
  // PARAMETROS
  // =========================================

  const claseId =
    route?.params?.claseId;

  const nombreClase =
    route?.params?.nombreClase ||
    "Tareas";


  // =========================================
  // VALIDAR
  // =========================================

  if (!claseId) {

    return (

      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >

        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={80}
          color="#999"
        />

        <Text
          style={{
            marginTop: 15,
            color: '#666',
            fontSize: 16
          }}
        >
          No se recibió la clase
        </Text>

      </SafeAreaView>
    );
  }


  // =========================================
  // STATES
  // =========================================

  const [tareas, setTareas] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  // =========================================
  // OBTENER TAREAS
  // =========================================

  const obtenerTareas = async () => {

    try {

      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/clases/${claseId}/tareas`
      );

      const data =
        await response.json();

      setTareas(data);

    } catch (error) {

      console.log(
        "Error al obtener tareas:",
        error
      );

    } finally {

      setLoading(false);
    }
  };


  // =========================================
  // RECARGAR AL ENTRAR
  // =========================================

  useEffect(() => {

    const unsubscribe =
      navigation.addListener(
        'focus',
        () => {

          obtenerTareas();
        }
      );

    return unsubscribe;

  }, [navigation]);


  // =========================================
  // UI
  // =========================================

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
          {nombreClase}
        </Text>


        <TouchableOpacity
          onPress={() =>
            navigation.navigate(
              'SubirTarea',
              { claseId }
            )
          }
        >

          <Ionicons
            name="add-circle"
            size={28}
            color={Colors.primary}
          />

        </TouchableOpacity>

      </View>


      {/* CONTENIDO */}

      <ScrollView
        contentContainerStyle={{
          padding: 20
        }}
      >


        {/* LOADING */}

        {loading && (

          <View style={styles.emptyContainer}>

            <MaterialCommunityIcons
              name="loading"
              size={80}
              color={Colors.primary}
            />

            <Text
              style={{
                color:
                  Colors.onSurfaceVariant,
                marginTop: 10
              }}
            >
              Cargando tareas...
            </Text>

          </View>
        )}


        {/* SIN TAREAS */}

        {!loading &&
          tareas.length === 0 && (

          <View style={styles.emptyContainer}>

            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={80}
              color={Colors.outline}
            />

            <Text
              style={{
                color:
                  Colors.onSurfaceVariant,
                marginTop: 10
              }}
            >
              No hay tareas asignadas.
            </Text>

          </View>
        )}


        {/* LISTADO */}

        {tareas.map((item) => (

          <View
            key={item.id}
            style={[
              styles.tareaCard,
              {
                backgroundColor:
                  Colors.surfaceContainerLow
              }
            ]}
          >

            {/* HEADER */}

            <View style={styles.cardHeader}>

              <MaterialCommunityIcons
                name="assignment"
                size={24}
                color={Colors.primary}
              />

              <Text
                style={[
                  styles.tareaTitle,
                  {
                    color:
                      Colors.onSurface
                  }
                ]}
              >
                {item.titulo}
              </Text>

            </View>


            {/* DESCRIPCION */}

            <Text
              style={[
                styles.tareaDesc,
                {
                  color:
                    Colors.onSurfaceVariant
                }
              ]}
            >
              {item.instrucciones}
            </Text>


            {/* DIVIDER */}

            <View style={styles.divider} />


            {/* FOOTER */}

            <View style={styles.cardFooter}>

              <View style={styles.dateInfo}>

                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={16}
                  color={Colors.error}
                />

                <Text
                  style={[
                    styles.dateText,
                    {
                      color:
                        Colors.error
                    }
                  ]}
                >
                  Entrega:
                  {" "}
                  {
                    new Date(
                      item.fecha_entrega
                    ).toLocaleDateString()
                  }
                </Text>

              </View>


              <TouchableOpacity>

                <Text
                  style={{
                    color:
                      Colors.primary,
                    fontWeight: 'bold'
                  }}
                >
                  Ver entregas
                </Text>

              </TouchableOpacity>

            </View>

          </View>

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
    paddingHorizontal: 15
  },

  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16
  },

  emptyContainer: {
    alignItems: 'center',
    marginTop: 50
  },

  tareaCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    elevation: 3
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },

  tareaTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10
  },

  tareaDesc: {
    fontSize: 14,
    marginBottom: 12
  },

  divider: {
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.1)',
    marginBottom: 12
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },

  dateText: {
    fontSize: 12,
    fontWeight: '600'
  }

});