import React, {
  useState,
  useEffect
} from 'react';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
 Image,
  Dimensions,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as DocumentPicker
from 'expo-document-picker';

import {
  Ionicons
} from '@expo/vector-icons';

import { Colors }
from '../constants/colors';

import {
  get,
  post,
  put,
  del
}
from '../services/api';

import { useAuth } from '../contexts/AuthContext';

const { width } =
Dimensions.get('window');

export default function
MaterialClaseScreen({
  navigation,
  route
}) {

  // =========================
  // RECIBIR CLASE
  // =========================

  const clase =
    route?.params?.clase;

  const { usuario } = useAuth();
  const esDocente = usuario?.rol === 'docente';

  // =========================
  // STATES (siempre antes de cualquier return — reglas de hooks)
  // =========================

  const [materiales, setMateriales] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [archivo, setArchivo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Material que se está editando (null = modo crear)
  const [materialEditando, setMaterialEditando] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarMateriales();
    setRefreshing(false);
  };

  const [form, setForm] = useState({
    titulo: '',
    descripcion: ''
  });

  // =========================
  // CARGAR MATERIALES
  // =========================

  useEffect(() => {
    if (clase?.id) {
      cargarMateriales();
    }
  }, [clase?.id]);

  // =========================
  // PROTECCION
  // =========================

  if (!clase) {

    return (

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >

        <Text>
          Cargando clase...
        </Text>

      </View>
    );
  }


  const cargarMateriales =
  async () => {

    try {

      const data =
      await get(
        `/materiales/${clase.id}`
      );

      setMateriales(data);

    } catch (error) {

      console.log(
        "Error materiales:",
        error
      );
    }
  };


  // =========================
  // SELECCIONAR ARCHIVO
  // =========================

  const seleccionarArchivo =
  async () => {

    const result =
    await DocumentPicker
    .getDocumentAsync({

      type: '*/*',
      copyToCacheDirectory: true

    });

    if (!result.canceled) {

      setArchivo(
        result.assets[0]
      );
    }
  };


  // =========================
  // PUBLICAR MATERIAL
  // =========================

  // Abrir el formulario en modo edición
  const iniciarEdicion = (item) => {
    setMaterialEditando(item);
    setForm({
      titulo: item.titulo || '',
      descripcion: item.descripcion || ''
    });
    setArchivo(null);
    setMostrarFormulario(true);
  };

  // Cerrar/cancelar el formulario
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setMaterialEditando(null);
    setArchivo(null);
    setForm({ titulo: '', descripcion: '' });
  };

  const handlePublicar =
  async () => {

    if (!form.titulo) {

      Alert.alert(
        "Error",
        "Ingresa título"
      );

      return;
    }

    try {

      if (materialEditando) {
        // EDITAR (JSON, no se cambia el archivo)
        await put(`/materiales/${materialEditando.id}`, {
          titulo: form.titulo,
          descripcion: form.descripcion
        });
        Alert.alert("Éxito", "Material actualizado");

      } else {
        // CREAR (FormData para adjuntar archivo)
        const formData = new FormData();
        formData.append('titulo', form.titulo);
        formData.append('descripcion', form.descripcion);
        formData.append('clase_id', clase.id);

        if (archivo) {
          formData.append('archivo', {
            uri: archivo.uri,
            name: archivo.name,
            type: archivo.mimeType || 'application/pdf'
          });
        }

        await post('/materiales', formData);
        Alert.alert("Éxito", "Material publicado");
      }

      cerrarFormulario();
      cargarMateriales();

    } catch (error) {

      Alert.alert(
        "Error",
        error.message
      );
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Eliminar Material",
      "¿Estás seguro de que deseas eliminar este material?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: async () => {
           try {
             await del(`/materiales/${id}`);
             Alert.alert("Éxito", "Material eliminado");
             cargarMateriales();
           } catch (error) {
             Alert.alert("Error", error.message);
           }
        }}
      ]
    );
  };



  return (

    <SafeAreaView
      style={styles.container}
    >

      <StatusBar
        barStyle="light-content"
      />

      {/* HEADER */}

      <View style={styles.header}>

        <TouchableOpacity
          style={styles.backBtn}
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

        <Text style={styles.headerTitle}>
          Educational Control
        </Text>

        <View style={{ width: 35 }} />

      </View>


      <ScrollView
        contentContainerStyle={{ padding: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
      >

        {/* TITULO */}

        <View style={styles.titleRow}>

          <Text style={styles.title}>
            Material Clase
          </Text>

          {esDocente && (
            <TouchableOpacity
              style={styles.publicarAction}

              onPress={() => {
                if (mostrarFormulario) {
                  cerrarFormulario();
                } else {
                  setMaterialEditando(null);
                  setForm({ titulo: '', descripcion: '' });
                  setArchivo(null);
                  setMostrarFormulario(true);
                }
              }}
            >

              <Text style={styles.publicarLabel}>
                {mostrarFormulario ? 'Cerrar' : 'Publicar'}
              </Text>

              <Ionicons
                name={mostrarFormulario ? 'close-circle' : 'add-circle'}
                size={34}
                color={Colors.primary}
              />

            </TouchableOpacity>
          )}

        </View>


        {/* FORMULARIO */}

        {mostrarFormulario && (

          <View style={styles.formCard}>

            <Text style={[styles.label, { fontSize: 16, marginBottom: 14, color: Colors.primary }]}>
              {materialEditando ? 'Editar material' : 'Nuevo material'}
            </Text>

            <Text style={styles.label}>
              Título
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Título"

              value={form.titulo}

              onChangeText={(t) =>
                setForm({
                  ...form,
                  titulo: t
                })
              }
            />


            <Text style={styles.label}>
              Descripción
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  height: 100
                }
              ]}

              multiline

              placeholder="Descripción"

              value={form.descripcion}

              onChangeText={(t) =>
                setForm({
                  ...form,
                  descripcion: t
                })
              }
            />


            {/* SUBIR ARCHIVO — solo al crear (PUT no cambia el archivo) */}

            {!materialEditando && (
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={seleccionarArchivo}
              >

                <Ionicons
                  name="cloud-upload-outline"
                  size={45}
                  color="#555"
                />

                <Text
                  style={{
                    marginTop: 12,
                    color: '#444'
                  }}
                >
                  {archivo ? archivo.name : 'Subir archivo'}
                </Text>

              </TouchableOpacity>
            )}


            <TouchableOpacity
              style={styles.btnPublicar}
              onPress={handlePublicar}
            >

              <Text style={styles.btnText}>
                {materialEditando ? 'GUARDAR CAMBIOS' : 'PUBLICAR MATERIAL'}
              </Text>

            </TouchableOpacity>

          </View>
        )}


        {/* VACIO */}

        {
          materiales.length === 0
          && !mostrarFormulario && (

            <View style={styles.emptyView}>

              <Image
                source={{
                  uri:
                  'https://img.freepik.com/free-vector/file-searching-concept-illustration_114360-441.jpg'
                }}

                style={styles.emptyImage}
              />

              <Text style={styles.emptyText}>
                {esDocente
                  ? "No has publicado material"
                  : "No hay materiales en esta clase"}
              </Text>

            </View>
          )
        }


        {/* LISTA */}

        {
          materiales.map((item) => (

            <TouchableOpacity
              key={item.id}
              style={styles.materialCard}
              onPress={() =>
                navigation.navigate(
                  'DetalleMaterial',
                  { material: item }
                )
              }
            >

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >

                <View style={styles.iconBox}>

                  <Ionicons
                    name="document-text"
                    size={28}
                    color="#4F46E5"
                  />

                </View>

                <View
                  style={{
                    marginLeft: 15
                  }}
                >

                  <Text
                    style={styles.cardTitle}
                  >
                    {item.titulo}
                  </Text>

                  <Text
                    style={styles.cardDesc}
                    numberOfLines={3}
                    ellipsizeMode="tail"
                  >
                    {item.descripcion}
                  </Text>

                </View>

              </View>


              {esDocente ? (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => iniciarEdicion(item)} style={{ padding: 8 }}>
                    <Ionicons name="create-outline" size={24} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
                    <Ionicons name="trash-outline" size={24} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color="#999"
                />
              )}

            </TouchableOpacity>
          ))
        }

      </ScrollView>

    </SafeAreaView>
  );
}


const styles =
StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor:
      Colors.background
  },

  header: {
    height: 60,
    backgroundColor:
      Colors.surfaceContainerHighest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingHorizontal: 20
  },

  backBtn: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center'
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color:
      Colors.onSurface
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginBottom: 20
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color:
      Colors.onSurface
  },

  publicarAction: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  publicarLabel: {
    marginRight: 8,
    color:
      Colors.primary,
    fontWeight: '600'
  },

  formCard: {
    backgroundColor:
      Colors.surfaceContainerLow,
    padding: 20,
    borderRadius: 22,
    marginBottom: 25
  },

  label: {
    fontWeight: 'bold',
    marginBottom: 8
  },

  input: {
    height: 55,
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 18
  },

  uploadBox: {
    height: 170,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CCC',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFF'
  },

  btnPublicar: {
    height: 55,
    borderRadius: 15,
    backgroundColor:
      '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center'
  },

  btnText: {
    color: '#FFF',
    fontWeight: 'bold'
  },

  emptyView: {
    marginTop: 60,
    alignItems: 'center'
  },

  emptyImage: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: 'contain'
  },

  emptyText: {
    marginTop: 15,
    color: '#666',
    fontSize: 16
  },

  materialCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    elevation: 3
  },

  iconBox: {
    width: 55,
    height: 55,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center'
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold'
  },

  cardDesc: {
    marginTop: 4,
    color: '#666'
  }

});