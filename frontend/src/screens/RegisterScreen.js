import React, { useState } from 'react';
import { post } from '../services/api';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const { width } = Dimensions.get('window');

export default function RegisterScreen({ navigation }) {

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [rol, setRol] = useState('');

  const [grado, setGrado] = useState('');
  const [seccion, setSeccion] = useState('');
  const [turno, setTurno] = useState('');

  const [materia, setMateria] = useState('');
  const [telefono, setTelefono] = useState('');

   const handleRegister = async () => {

    console.log("🔥 CLICK REGISTER");

    if (!nombre || !correo || !password || !confirm || !rol) {
      alert("Completa todos los campos");
      return;
    }

    if (password !== confirm) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      const res = await post("/register", {
        nombre,
        correo,
        password,
        rol,
        grado,
        seccion,
        turno,
        materia_principal: materia,
        telefono
      });

      alert(res.mensaje);
      navigation.navigate("Login");

    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>

      {/* FONDO DECORATIVO */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >

          <ScrollView contentContainerStyle={styles.scroll}>

            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoInner}>
                  <MaterialCommunityIcons name="account-plus" size={40} color={Colors.primary} />
                </View>
                <View style={styles.logoGlow} />
              </View>

              <Text style={styles.title}>Crear cuenta 🎓</Text>
              <Text style={styles.subtitle}>
                Completa tus datos para registrarte
              </Text>
            </View>

            {/* CARD */}
            <View style={styles.card}>

              {/* BORDER SUPERIOR */}
              <LinearGradient
                colors={[Colors.primary + '33', Colors.primary, Colors.primary + '33']}
                style={styles.cardTopBorder}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />

              <View style={styles.form}>

                {/* NOMBRE */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nombre completo</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="account-outline" size={20} color={Colors.onSurfaceVariant} style={styles.inputIcon}/>
                    <TextInput style={styles.input} value={nombre} onChangeText={setNombre}/>
                  </View>
                </View>

                {/* CORREO */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Correo electrónico</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={Colors.onSurfaceVariant} style={styles.inputIcon}/>
                    <TextInput style={styles.input} value={correo} onChangeText={setCorreo}/>
                  </View>
                </View>

                {/* PASSWORD */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Contraseña</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.onSurfaceVariant} style={styles.inputIcon}/>
                    <TextInput style={styles.input} secureTextEntry value={password} onChangeText={setPassword}/>
                  </View>
                </View>

                {/* CONFIRM */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmar contraseña</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons name="lock-check-outline" size={20} color={Colors.onSurfaceVariant} style={styles.inputIcon}/>
                    <TextInput style={styles.input} secureTextEntry value={confirm} onChangeText={setConfirm}/>
                  </View>
                </View>

                {/* ROLES */}
                <Text style={styles.label}>Seleccione su rol</Text>

                <View style={styles.roles}>
                  <TouchableOpacity
                    style={[styles.roleBtn, rol === "docente" && styles.roleActive]}
                    onPress={() => setRol("docente")}
                  >
                    <Text style={styles.roleText}>Docente</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleBtn, rol === "estudiante" && styles.roleActive]}
                    onPress={() => setRol("estudiante")}
                  >
                    <Text style={styles.roleText}>Estudiante</Text>
                  </TouchableOpacity>
                </View>

                {/* CAMPOS DINÁMICOS */}
                {rol === "estudiante" && (
                  <>
                    <TextInput style={styles.input} placeholder="Grado" value={grado} onChangeText={setGrado}/>
                    <TextInput style={styles.input} placeholder="Sección" value={seccion} onChangeText={setSeccion}/>
                    <TextInput style={styles.input} placeholder="Turno" value={turno} onChangeText={setTurno}/>
                  </>
                )}

                {rol === "docente" && (
                  <>
                    <TextInput style={styles.input} placeholder="Materia" value={materia} onChangeText={setMateria}/>
                    <TextInput style={styles.input} placeholder="Teléfono" value={telefono} onChangeText={setTelefono}/>
                  </>
                )}

                {/* BOTÓN */}
                <TouchableOpacity style={styles.buttonWrapper} onPress={handleRegister}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryContainer]}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>Crear cuenta</Text>
                  </LinearGradient>
                </TouchableOpacity>

              </View>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.link}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  bgCircle1: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: Colors.primary,
    top: -100,
    left: -100,
    opacity: 0.1,
  },

  bgCircle2: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: Colors.secondary,
    bottom: -100,
    right: -100,
    opacity: 0.1,
  },

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },

  logoContainer: {
    width: 64,
    height: 64,
    marginBottom: 20,
  },

  logoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '1A',
  },

  title: {
    fontSize: 26,
    color: Colors.onBackground,
    fontWeight: 'bold',
  },

  subtitle: {
    color: Colors.onSurfaceVariant,
  },

  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 20,
    padding: 20,
  },

  cardTopBorder: {
    height: 4,
    width: '100%',
    marginBottom: 15,
  },

  form: {
    gap: 15,
  },

  inputGroup: {
    gap: 5,
  },

  label: {
    color: Colors.onBackground,
  },

  inputWrapper: {
    position: 'relative',
  },

  inputIcon: {
    position: 'absolute',
    left: 15,
    top: 15,
    zIndex: 1,
  },

  input: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    padding: 14,
    paddingLeft: 45,
    color: Colors.onBackground,
  },

  roles: {
    flexDirection: 'row',
    gap: 10,
  },

  roleBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    alignItems: 'center',
  },

  roleActive: {
    backgroundColor: Colors.primary,
  },

  roleText: {
    color: Colors.onBackground,
  },

  buttonWrapper: {
    marginTop: 10,
  },

  button: {
    height: 55,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    color: Colors.surface,
    fontWeight: 'bold',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },

  footerText: {
    color: Colors.onSurfaceVariant,
  },

  link: {
    color: Colors.primary,
  },

});