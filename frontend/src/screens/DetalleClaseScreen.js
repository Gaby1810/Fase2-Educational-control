// ===============================
// DetalleClaseScreen.jsx
// ===============================

import React from 'react';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';

export default function DetalleClaseScreen({ navigation, route }) {

  const clase = route?.params?.clase;

  const { usuario } = useAuth();

  const esDocente = usuario?.rol === 'docente';

  if (!clase) {

    return (

      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor: Colors.background,
            justifyContent: 'center',
            alignItems: 'center'
          }
        ]}
      >
        <Text style={{ color: Colors.onSurface }}>
          No se recibió la clase
        </Text>
      </SafeAreaView>

    );
  }

  // ===============================
  // SECCIONES SEGÚN ROL
  // ===============================

  const secciones = esDocente
    ? [
        {
          key: 'materiales',
          titulo: 'Materiales',
          descripcion: 'Recursos y archivos compartidos',
          icono: 'book-open-page-variant',
          color: Colors.primary,
          onPress: () =>
            navigation.navigate('Materiales', { clase })
        },
        {
          key: 'tareas',
          titulo: 'Tareas',
          descripcion: 'Trabajos asignados',
          icono: 'clipboard-text-outline',
          color: Colors.tertiary,
          onPress: () =>
            navigation.navigate('Tareas', {
              claseId: clase.id,
              nombreClase: clase.nombre
            })
        },
        {
          key: 'notas',
          titulo: 'Notas',
          descripcion: 'Calificaciones',
          icono: 'chart-bar',
          color: Colors.secondary,
          onPress: () =>
            navigation.navigate('Notas', {
              claseId: clase.id
            })
        },
        {
          key: 'asistencia',
          titulo: 'Asistencia',
          descripcion: 'Registro de asistencia',
          icono: 'account-check-outline',
          color: '#78dc77',
          onPress: () =>
            navigation.navigate('Asistencia', {
              claseId: clase.id,
              nombreClase: clase.nombre
            })
        }
      ]
    : [
        {
          key: 'materiales',
          titulo: 'Materiales',
          descripcion: 'Recursos compartidos',
          icono: 'book-open-page-variant',
          color: Colors.primary,
          onPress: () =>
            navigation.navigate('Materiales', { clase })
        },
        {
          key: 'tareas',
          titulo: 'Tareas',
          descripcion: 'Trabajos asignados',
          icono: 'clipboard-text-outline',
          color: Colors.tertiary,
          onPress: () =>
            navigation.navigate('Tareas', {
              claseId: clase.id,
              nombreClase: clase.nombre
            })
        }
      ];

  return (

    <View
      style={[
        styles.container,
        { backgroundColor: Colors.background }
      ]}
    >

      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <SafeAreaView
        edges={['top']}
        style={{
          backgroundColor: Colors.surfaceContainerHighest
        }}
      >

        <View style={styles.header}>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
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
              { color: Colors.onSurface }
            ]}
          >
            Detalle de clase
          </Text>

          <View style={{ width: 35 }} />

        </View>

      </SafeAreaView>


      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* BANNER */}
        <View
          style={[
            styles.banner,
            {
              backgroundColor:
                Colors.surfaceContainerHigh
            }
          ]}
        >

          <View
            style={[
              styles.bannerIcon,
              {
                backgroundColor:
                  Colors.primary + '22'
              }
            ]}
          >

            <MaterialCommunityIcons
              name="school"
              size={32}
              color={Colors.primary}
            />

          </View>

          <Text
            style={[
              styles.bannerTitle,
              { color: Colors.onSurface }
            ]}
          >
            {clase.nombre}
          </Text>

          <View style={styles.infoRow}>

            <View
              style={[
                styles.chip,
                {
                  backgroundColor:
                    Colors.surfaceContainerHighest
                }
              ]}
            >
              <Text style={styles.chipText}>
                {clase.grado}
              </Text>
            </View>

            <View
              style={[
                styles.chip,
                {
                  backgroundColor:
                    Colors.surfaceContainerHighest
                }
              ]}
            >
              <Text style={styles.chipText}>
                Sección {clase.seccion}
              </Text>
            </View>

          </View>

        </View>


        {/* GRID */}
        <View style={styles.grid}>

          {secciones.map((s) => (

            <TouchableOpacity
              key={s.key}
              style={[
                styles.gridCard,
                {
                  backgroundColor:
                    Colors.surfaceContainerLow
                }
              ]}
              onPress={s.onPress}
            >

              <View
                style={[
                  styles.gridIcon,
                  {
                    backgroundColor:
                      s.color + '22'
                  }
                ]}
              >

                <MaterialCommunityIcons
                  name={s.icono}
                  size={26}
                  color={s.color}
                />

              </View>

              <Text
                style={[
                  styles.gridTitle,
                  { color: Colors.onSurface }
                ]}
              >
                {s.titulo}
              </Text>

              <Text
                style={[
                  styles.gridDesc,
                  {
                    color:
                      Colors.onSurfaceVariant
                  }
                ]}
              >
                {s.descripcion}
              </Text>

            </TouchableOpacity>

          ))}

        </View>

      </ScrollView>

    </View>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1
  },

  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },

  headerBtn: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center'
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },

  banner: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    alignItems: 'center'
  },

  bannerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },

  bannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14
  },

  infoRow: {
    flexDirection: 'row',
    gap: 10
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100
  },

  chipText: {
    fontSize: 12,
    fontWeight: '600'
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },

  gridCard: {
    width: '47%',
    borderRadius: 18,
    padding: 18,
    minHeight: 130,
    marginBottom: 14
  },

  gridIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },

  gridTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },

  gridDesc: {
    fontSize: 11
  }

});