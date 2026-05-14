import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { post } from '../services/api';
import AnimatedBackground from '../components/AnimatedBackground';

export default function ForgotPasswordScreen({ navigation }) {

  // step: 1=email, 2=código, 3=nueva contraseña, 4=éxito
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [nuevaPass, setNuevaPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [err, setErr] = useState('');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const CODIGO_LEN = 6;

  // ===================================================
  // PASO 1: solicitar código
  // ===================================================
  const solicitarCodigo = async () => {

    setErr('');
    if (!EMAIL_REGEX.test(correo)) {
      setErr('Ingresa un correo válido');
      return;
    }

    try {
      setLoading(true);
      await post('/auth/forgot-password', {
        correo: correo.trim().toLowerCase()
      });
      setStep(2);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // PASO 2: verificar código
  // ===================================================
  const sanitizarCodigo = (txt) =>
    String(txt).replace(/[^0-9]/g, '').slice(0, CODIGO_LEN);

  const verificarCodigo = async () => {

    setErr('');
    if (codigo.length !== CODIGO_LEN) {
      setErr(`El código debe tener ${CODIGO_LEN} dígitos`);
      return;
    }

    try {
      setLoading(true);
      const res = await post('/auth/verify-code', {
        correo: correo.trim().toLowerCase(),
        codigo
      });
      setResetToken(res.resetToken);
      setStep(3);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // PASO 3: cambiar contraseña
  // ===================================================
  const cambiarPassword = async () => {

    setErr('');
    if (nuevaPass.length < 6) {
      setErr('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (nuevaPass !== confirmPass) {
      setErr('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      await post('/auth/reset-password', {
        resetToken,
        password: nuevaPass
      });
      setStep(4);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // CANCELAR
  // ===================================================
  const cancelar = () => {
    Alert.alert(
      "¿Cancelar?",
      "Vas a perder el progreso de la recuperación.",
      [
        { text: "Seguir", style: "cancel" },
        {
          text: "Sí, salir",
          style: "destructive",
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  // ===================================================
  // RENDER COMÚN
  // ===================================================
  const renderHeader = (icono, titulo, sub) => (
    <View style={styles.headerArea}>
      <View style={styles.logoContainer}>
        <View style={styles.logoInner}>
          <MaterialCommunityIcons name={icono} size={40} color={Colors.primary} />
        </View>
        <View style={styles.logoGlow} />
      </View>
      <Text style={styles.title}>{titulo}</Text>
      <Text style={styles.subtitle}>{sub}</Text>
    </View>
  );

  const renderError = () => err
    ? <Text style={styles.errorText}>{err}</Text>
    : null;

  // ===================================================
  // RENDER
  // ===================================================
  return (

    <View style={styles.container}>

      <AnimatedBackground intensity="normal" />

      <SafeAreaView style={{ flex: 1 }}>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >

            {/* X arriba para cancelar */}
            {step !== 4 && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={cancelar}
              >
                <MaterialCommunityIcons name="close" size={22} color={Colors.onSurface} />
              </TouchableOpacity>
            )}


            {/* ============ PASO 1: EMAIL ============ */}
            {step === 1 && (
              <>
                {renderHeader(
                  'lock-question',
                  '¿Olvidaste tu contraseña?',
                  'Te enviaremos un código de verificación a tu correo registrado.'
                )}

                <View style={styles.card}>

                  <LinearGradient
                    colors={[Colors.primary + '33', Colors.primary, Colors.primary + '33']}
                    style={styles.cardTopBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />

                  <View style={styles.form}>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Correo electrónico</Text>
                      <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons
                          name="email-outline"
                          size={20}
                          color={Colors.onSurfaceVariant}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="correo@ejemplo.com"
                          placeholderTextColor={Colors.onSurfaceVariant + '80'}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={correo}
                          onChangeText={(t) => { setCorreo(t); if (err) setErr(''); }}
                        />
                      </View>
                    </View>

                    {renderError()}

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.submitWrapper, { opacity: loading ? 0.7 : 1 }]}
                      onPress={solicitarCodigo}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={[Colors.primary, Colors.primaryContainer]}
                        style={styles.submitBtn}
                      >
                        {loading
                          ? <ActivityIndicator color={Colors.onPrimary} />
                          : <Text style={styles.submitText}>ENVIAR CÓDIGO</Text>
                        }
                      </LinearGradient>
                    </TouchableOpacity>

                  </View>
                </View>
              </>
            )}


            {/* ============ PASO 2: CÓDIGO ============ */}
            {step === 2 && (
              <>
                {renderHeader(
                  'email-check-outline',
                  'Revisa tu correo',
                  `Enviamos un código de ${CODIGO_LEN} dígitos a ${correo}`
                )}

                <View style={styles.card}>

                  <LinearGradient
                    colors={[Colors.primary + '33', Colors.primary, Colors.primary + '33']}
                    style={styles.cardTopBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />

                  <View style={styles.form}>

                    <TextInput
                      style={styles.codigoInput}
                      placeholder="000000"
                      placeholderTextColor={Colors.onSurfaceVariant + '55'}
                      keyboardType="number-pad"
                      autoCorrect={false}
                      maxLength={CODIGO_LEN}
                      value={codigo}
                      onChangeText={(t) => {
                        setCodigo(sanitizarCodigo(t));
                        if (err) setErr('');
                      }}
                    />

                    {renderError()}

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[
                        styles.submitWrapper,
                        { opacity: loading || codigo.length !== CODIGO_LEN ? 0.6 : 1 }
                      ]}
                      onPress={verificarCodigo}
                      disabled={loading || codigo.length !== CODIGO_LEN}
                    >
                      <LinearGradient
                        colors={[Colors.primary, Colors.primaryContainer]}
                        style={styles.submitBtn}
                      >
                        {loading
                          ? <ActivityIndicator color={Colors.onPrimary} />
                          : <Text style={styles.submitText}>VERIFICAR</Text>
                        }
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => { setStep(1); setCodigo(''); setErr(''); }}
                      style={{ marginTop: 14, alignSelf: 'center' }}
                    >
                      <Text style={{ color: Colors.primary }}>
                        Reenviar a otro correo
                      </Text>
                    </TouchableOpacity>

                  </View>
                </View>
              </>
            )}


            {/* ============ PASO 3: NUEVA CONTRASEÑA ============ */}
            {step === 3 && (
              <>
                {renderHeader(
                  'lock-reset',
                  'Crea una nueva contraseña',
                  'Asegúrate de que tenga al menos 6 caracteres.'
                )}

                <View style={styles.card}>

                  <LinearGradient
                    colors={[Colors.primary + '33', Colors.primary, Colors.primary + '33']}
                    style={styles.cardTopBorder}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />

                  <View style={styles.form}>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Nueva contraseña</Text>
                      <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons
                          name="lock-outline"
                          size={20}
                          color={Colors.onSurfaceVariant}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={[styles.input, { paddingRight: 50 }]}
                          placeholder="••••••••"
                          placeholderTextColor={Colors.onSurfaceVariant + '80'}
                          secureTextEntry={!showPass}
                          value={nuevaPass}
                          onChangeText={(t) => { setNuevaPass(t); if (err) setErr(''); }}
                        />
                        <TouchableOpacity
                          style={styles.visibilityIcon}
                          onPress={() => setShowPass(!showPass)}
                        >
                          <MaterialCommunityIcons
                            name={showPass ? "eye-off-outline" : "eye-outline"}
                            size={20}
                            color={Colors.onSurfaceVariant}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Confirmar contraseña</Text>
                      <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons
                          name="lock-check-outline"
                          size={20}
                          color={Colors.onSurfaceVariant}
                          style={styles.inputIcon}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="••••••••"
                          placeholderTextColor={Colors.onSurfaceVariant + '80'}
                          secureTextEntry={!showPass}
                          value={confirmPass}
                          onChangeText={(t) => { setConfirmPass(t); if (err) setErr(''); }}
                        />
                      </View>
                    </View>

                    {renderError()}

                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[styles.submitWrapper, { opacity: loading ? 0.7 : 1 }]}
                      onPress={cambiarPassword}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={[Colors.primary, Colors.primaryContainer]}
                        style={styles.submitBtn}
                      >
                        {loading
                          ? <ActivityIndicator color={Colors.onPrimary} />
                          : <Text style={styles.submitText}>CAMBIAR CONTRASEÑA</Text>
                        }
                      </LinearGradient>
                    </TouchableOpacity>

                  </View>
                </View>
              </>
            )}


            {/* ============ PASO 4: ÉXITO ============ */}
            {step === 4 && (
              <View style={styles.successContainer}>

                <View style={styles.successIcon}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={70}
                    color={Colors.secondary}
                  />
                </View>

                <Text style={styles.title}>¡Listo!</Text>
                <Text style={styles.subtitle}>
                  Tu contraseña fue actualizada correctamente.{'\n'}
                  Ya puedes iniciar sesión con tu nueva contraseña.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.submitWrapper, { marginTop: 28, width: '100%' }]}
                  onPress={() =>
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    })
                  }
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryContainer]}
                    style={styles.submitBtn}
                  >
                    <Text style={styles.submitText}>IR A INICIAR SESIÓN</Text>
                  </LinearGradient>
                </TouchableOpacity>

              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: Colors.background },

  bgCircle1: {
    position: 'absolute',
    width: 380, height: 380, borderRadius: 190,
    backgroundColor: Colors.primary,
    top: -120, left: -120,
    opacity: 0.1
  },
  bgCircle2: {
    position: 'absolute',
    width: 380, height: 380, borderRadius: 190,
    backgroundColor: Colors.secondary,
    bottom: -120, right: -120,
    opacity: 0.08
  },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60
  },

  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10
  },

  headerArea: { alignItems: 'center', marginBottom: 28, marginTop: 30 },

  logoContainer: {
    width: 64, height: 64, marginBottom: 20,
    alignItems: 'center', justifyContent: 'center'
  },
  logoInner: {
    width: '100%', height: '100%',
    borderRadius: 32,
    backgroundColor: Colors.surfaceContainerHighest,
    alignItems: 'center', justifyContent: 'center'
  },
  logoGlow: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + '1A'
  },

  title: {
    fontSize: 24, fontWeight: 'bold',
    color: Colors.onBackground, textAlign: 'center', marginBottom: 6
  },
  subtitle: {
    fontSize: 13, color: Colors.onSurfaceVariant,
    textAlign: 'center', maxWidth: 320, lineHeight: 19
  },

  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 22, padding: 24
  },
  cardTopBorder: {
    height: 4, width: '100%', marginBottom: 18, borderRadius: 2
  },

  form: { gap: 16 },

  inputGroup: { gap: 6 },
  label: { fontSize: 13, color: Colors.onBackground, fontWeight: '600' },
  inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 10 },
  input: {
    flex: 1, height: 52,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingLeft: 48, paddingRight: 16,
    color: Colors.onBackground, fontSize: 15
  },
  visibilityIcon: {
    position: 'absolute', right: 16, height: 52,
    justifyContent: 'center', paddingHorizontal: 4
  },

  codigoInput: {
    height: 64,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: 14, paddingHorizontal: 18,
    color: Colors.onBackground,
    fontSize: 28, fontWeight: 'bold',
    letterSpacing: 14, textAlign: 'center'
  },

  errorText: {
    color: '#FF6B6B', fontSize: 13, textAlign: 'center'
  },

  submitWrapper: { marginTop: 6 },
  submitBtn: {
    height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center'
  },
  submitText: {
    color: Colors.onPrimary,
    fontWeight: 'bold', fontSize: 15, letterSpacing: 1
  },

  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30
  },
  successIcon: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.secondary + '22',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20
  }

});
