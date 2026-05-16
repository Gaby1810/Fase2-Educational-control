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
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { get, post } from '../services/api';

import { Colors } from '../constants/colors';

import { useAuth } from '../contexts/AuthContext';
import { MATERIAS, GRADOS, SECCIONES } from '../constants/options';
import SelectInput from '../components/SelectInput';

const { width } = Dimensions.get('window');

export default function ClasesListScreen({ navigation }) {

  const { usuario, logout } = useAuth();
  const esDocente = usuario?.rol === 'docente';

  // ¿Es la pantalla raíz? (estudiante que entró directo aquí tras login)
  const esRaiz = !navigation.canGoBack();

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, salir",
          style: "destructive",
          onPress: async () => {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" }]
            });
          }
        }
      ]
    );
  };

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clases, setClases] = useState([]);

  const [form, setForm] = useState({
    nombre: '',
    grado: '',
    seccion: ''
  });

  // ====== Modal "Unirse a clase" (estudiante) ======
  const CODIGO_LEN = 6;
  const [unirseVisible, setUnirseVisible] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [unirseError, setUnirseError] = useState('');
  const [uniendo, setUniendo] = useState(false);

  // ====== Modal de éxito ======
  const [exitoVisible, setExitoVisible] = useState(false);
  const [claseUnida, setClaseUnida] = useState(null);

  // Normaliza la entrada del código: solo A-Z y 0-9, mayúsculas, máx 6
  const sanitizarCodigo = (txt) =>
    String(txt)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, CODIGO_LEN);

  const abrirModalUnirse = () => {
    setCodigo('');
    setUnirseError('');
    setUnirseVisible(true);
  };

  const intentarCerrarModal = () => {
    // Si no ha escrito nada, cerrar directo
    if (!codigo) {
      setUnirseVisible(false);
      return;
    }
    Alert.alert(
      "¿Detener el proceso?",
      "Si sales perderás el código que estabas escribiendo.",
      [
        { text: "Seguir aquí", style: "cancel" },
        {
          text: "Sí, salir",
          style: "destructive",
          onPress: () => {
            setCodigo('');
            setUnirseError('');
            setUnirseVisible(false);
          }
        }
      ]
    );
  };

  const handleUnirse = async () => {

    if (codigo.length !== CODIGO_LEN) {
      setUnirseError(`El código debe tener ${CODIGO_LEN} caracteres`);
      return;
    }

    try {
      setUniendo(true);
      setUnirseError('');

      const res = await post('/clases/unirse', { codigo_clase: codigo });

      // éxito
      setClaseUnida(res.clase);
      setUnirseVisible(false);
      setCodigo('');
      setExitoVisible(true);

    } catch (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('inválido') || msg.toLowerCase().includes('invalido')) {
        setUnirseError("Código inválido. Intenta de nuevo.");
      } else if (msg.toLowerCase().includes('ya estás inscrito') || msg.toLowerCase().includes('inscrito')) {
        setUnirseError("Ya estás inscrito en esta clase.");
      } else {
        setUnirseError(msg);
      }
    } finally {
      setUniendo(false);
    }
  };

  const continuarAClase = () => {
    setExitoVisible(false);
    cargarClases();
    if (claseUnida) {
      navigation.navigate("DetalleClase", { clase: claseUnida });
    }
  };

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

        {esRaiz ? (
          <View style={{ width: 35 }} />
        ) : (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
        )}

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

        {esRaiz ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {!esDocente && (
              <TouchableOpacity
                style={styles.headerBtn}
                onPress={() => navigation.navigate('Perfil')}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={handleLogout}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: 35 }} />
        )}

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
            {esDocente ? 'Clases' : 'Mis Clases'}
          </Text>

          {esDocente && (
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
          )}

          {!esDocente && (
            <TouchableOpacity
              style={styles.addBtnAction}
              onPress={abrirModalUnirse}
            >

              <Text
                style={{
                  color: Colors.primary,
                  marginRight: 8,
                  fontWeight: '600'
                }}
              >
                Unirse
              </Text>

              <Ionicons
                name="enter-outline"
                size={30}
                color={Colors.primary}
              />

            </TouchableOpacity>
          )}

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
              Materia
            </Text>

            <View style={{ marginBottom: 15 }}>
              <SelectInput
                placeholder="Selecciona la materia"
                title="Materia"
                icon="book-open-page-variant"
                value={form.nombre}
                options={MATERIAS}
                onSelect={(v) => setForm({ ...form, nombre: v })}
              />
            </View>

            <Text style={styles.label}>
              Grado
            </Text>

            <View style={{ marginBottom: 15 }}>
              <SelectInput
                placeholder="Selecciona el grado"
                title="Grado"
                icon="school-outline"
                value={form.grado}
                options={GRADOS}
                onSelect={(v) => setForm({ ...form, grado: v })}
              />
            </View>

            <Text style={styles.label}>
              Sección
            </Text>

            <View style={{ marginBottom: 15 }}>
              <SelectInput
                placeholder="Selecciona la sección"
                title="Sección"
                icon="alpha-s-circle-outline"
                value={form.seccion}
                options={SECCIONES}
                onSelect={(v) => setForm({ ...form, seccion: v })}
              />
            </View>

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
              {esDocente
                ? "No hay clases creadas"
                : "No estás inscrito en ninguna clase"}
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


      {/* ===================== */}
      {/* MODAL: UNIRSE A CLASE */}
      {/* ===================== */}
      <Modal
        visible={unirseVisible}
        animationType="fade"
        transparent
        onRequestClose={intentarCerrarModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: Colors.surfaceContainerHigh }]}>

            {/* Botón X arriba derecha */}
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={intentarCerrarModal}
            >
              <Ionicons name="close" size={22} color={Colors.onSurface} />
            </TouchableOpacity>

            <View style={styles.modalIconCircle}>
              <Ionicons name="key-outline" size={28} color={Colors.primary} />
            </View>

            <Text style={[styles.modalTitle, { color: Colors.onSurface }]}>
              Unirse a una clase
            </Text>

            <Text style={[styles.modalSubtitle, { color: Colors.onSurfaceVariant }]}>
              Ingresa el código de {CODIGO_LEN} caracteres que te dio tu docente.
            </Text>

            <TextInput
              style={[
                styles.codigoInput,
                {
                  backgroundColor: Colors.surfaceContainerHighest,
                  color: Colors.onSurface,
                  borderColor: unirseError ? Colors.error : Colors.outlineVariant
                }
              ]}
              placeholder="XXXXXX"
              placeholderTextColor={Colors.onSurfaceVariant}
              value={codigo}
              onChangeText={(t) => {
                setCodigo(sanitizarCodigo(t));
                if (unirseError) setUnirseError('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={CODIGO_LEN}
            />

            {!!unirseError && (
              <Text style={styles.errorText}>{unirseError}</Text>
            )}

            <TouchableOpacity
              style={[
                styles.modalSubmit,
                {
                  backgroundColor: Colors.primary,
                  opacity: uniendo || codigo.length !== CODIGO_LEN ? 0.6 : 1
                }
              ]}
              onPress={handleUnirse}
              disabled={uniendo || codigo.length !== CODIGO_LEN}
            >
              {uniendo
                ? <ActivityIndicator color={Colors.onPrimary} />
                : <Text style={[styles.modalSubmitText, { color: Colors.onPrimary }]}>UNIRME</Text>
              }
            </TouchableOpacity>

          </View>
        </View>
      </Modal>


      {/* ===================== */}
      {/* MODAL: ÉXITO */}
      {/* ===================== */}
      <Modal
        visible={exitoVisible}
        animationType="fade"
        transparent
        onRequestClose={continuarAClase}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: Colors.surfaceContainerHigh }]}>

            <View style={[styles.modalIconCircle, { backgroundColor: Colors.secondary + '22' }]}>
              <Ionicons name="checkmark-circle" size={36} color={Colors.secondary} />
            </View>

            <Text style={[styles.modalTitle, { color: Colors.onSurface }]}>
              ¡Inscripción exitosa!
            </Text>

            <Text style={[styles.modalSubtitle, { color: Colors.onSurfaceVariant }]}>
              Te uniste a {claseUnida?.nombre ? `"${claseUnida.nombre}"` : 'la clase'}.
            </Text>

            <TouchableOpacity
              style={[styles.modalSubmit, { backgroundColor: Colors.primary }]}
              onPress={continuarAClase}
            >
              <Text style={[styles.modalSubmitText, { color: Colors.onPrimary }]}>
                CONTINUAR
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

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
  },

  // ===== Modales =====
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center'
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(203,214,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18
  },
  codigoInput: {
    width: '100%',
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 6,
    textAlign: 'center'
  },
  errorText: {
    marginTop: 10,
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center'
  },
  modalSubmit: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalSubmitText: {
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1
  }

});