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

export default function DetalleClaseScreen({ navigation, route }) {

  const clase = route?.params?.clase;

  if (!clase) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }
        ]}
      >
        <Text style={{ color: Colors.onSurface }}>No se recibió la clase</Text>
      </SafeAreaView>
    );
  }

  // Configuración de las 4 secciones
  const secciones = [
    {
      key: 'materiales',
      titulo: 'Materiales',
      descripcion: 'Recursos y archivos compartidos',
      icono: 'book-open-page-variant',
      color: Colors.primary,
      onPress: () => navigation.navigate('Materiales', { clase })
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
      descripcion: 'Calificaciones de la clase',
      icono: 'chart-bar',
      color: Colors.secondary,
      onPress: () =>
        navigation.navigate('Notas', {
          claseId: clase.id,
          tareaNombre: clase.nombre
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
  ];

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>

      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: Colors.surfaceContainerHighest }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBtn}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: Colors.onSurface }]}>
            Detalle de clase
          </Text>

          <View style={{ width: 35 }} />
        </View>
      </SafeAreaView>


      <ScrollView contentContainerStyle={{ padding: 20 }}>

        {/* BANNER DE LA CLASE */}
        <View
          style={[
            styles.banner,
            { backgroundColor: Colors.surfaceContainerHigh }
          ]}
        >
          <View
            style={[
              styles.bannerIcon,
              { backgroundColor: Colors.primary + '22' }
            ]}
          >
            <MaterialCommunityIcons
              name="school"
              size={32}
              color={Colors.primary}
            />
          </View>

          <Text style={[styles.bannerTitle, { color: Colors.onSurface }]}>
            {clase.nombre}
          </Text>

          {/* Info chips */}
          <View style={styles.infoRow}>

            <View
              style={[
                styles.chip,
                { backgroundColor: Colors.surfaceContainerHighest }
              ]}
            >
              <MaterialCommunityIcons
                name="school-outline"
                size={14}
                color={Colors.onSurfaceVariant}
              />
              <Text style={[styles.chipText, { color: Colors.onSurfaceVariant }]}>
                {clase.grado || '—'}
              </Text>
            </View>

            <View
              style={[
                styles.chip,
                { backgroundColor: Colors.surfaceContainerHighest }
              ]}
            >
              <MaterialCommunityIcons
                name="alpha-s-circle-outline"
                size={14}
                color={Colors.onSurfaceVariant}
              />
              <Text style={[styles.chipText, { color: Colors.onSurfaceVariant }]}>
                Sección {clase.seccion || '—'}
              </Text>
            </View>

          </View>

          {/* Docente */}
          <View style={styles.docenteRow}>
            <MaterialCommunityIcons
              name="account-tie"
              size={16}
              color={Colors.primary}
            />
            <Text style={[styles.docenteText, { color: Colors.onSurface }]}>
              Docente:{' '}
              <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>
                {clase.docente || 'Sin asignar'}
              </Text>
            </Text>
          </View>

          {/* Código */}
          <View
            style={[
              styles.codigoBox,
              { backgroundColor: Colors.surfaceContainerHighest }
            ]}
          >
            <Text style={[styles.codigoLabel, { color: Colors.onSurfaceVariant }]}>
              CÓDIGO DE CLASE
            </Text>
            <Text style={[styles.codigoValue, { color: Colors.primary }]}>
              {clase.codigo_clase}
            </Text>
          </View>

        </View>


        {/* TITULO SECCIONES */}
        <Text style={[styles.sectionTitle, { color: Colors.onSurfaceVariant }]}>
          ACCESOS RÁPIDOS
        </Text>


        {/* GRID DE 4 BOTONES */}
        <View style={styles.grid}>

          {secciones.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[
                styles.gridCard,
                { backgroundColor: Colors.surfaceContainerLow }
              ]}
              onPress={s.onPress}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.gridIcon,
                  { backgroundColor: s.color + '22' }
                ]}
              >
                <MaterialCommunityIcons
                  name={s.icono}
                  size={26}
                  color={s.color}
                />
              </View>

              <Text style={[styles.gridTitle, { color: Colors.onSurface }]}>
                {s.titulo}
              </Text>

              <Text style={[styles.gridDesc, { color: Colors.onSurfaceVariant }]}>
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

  container: { flex: 1 },

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
    gap: 10,
    marginBottom: 14
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600'
  },

  docenteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18
  },
  docenteText: {
    fontSize: 14
  },

  codigoBox: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center'
  },
  codigoLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 4
  },
  codigoValue: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 6
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 14,
    marginLeft: 4
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between'
  },
  gridCard: {
    width: '47%',
    borderRadius: 18,
    padding: 18,
    minHeight: 130
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
