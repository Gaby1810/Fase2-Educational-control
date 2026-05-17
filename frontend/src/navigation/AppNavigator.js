// ===============================
// AppNavigator.js
// Navegación con rutas protegidas:
//   - Sin sesión  → Stack PÚBLICO  (Home, Login, Register, ForgotPassword)
//   - Con sesión  → Stack PRIVADO  (según rol)
// El cambio entre stacks es automático al hacer login/logout.
// ===============================

import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/colors';

import HomeScreen           from '../screens/HomeScreen';
import LoginScreen          from '../screens/LoginScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

import DashboardScreen      from '../screens/DashboardScreen';
import ClasesListScreen     from '../screens/ClasesListScreen';
import DetalleClaseScreen   from '../screens/DetalleClaseScreen';
import MaterialesScreen     from '../screens/MaterialScreen';
import EntregasTareaScreen  from '../screens/EntregasTareaScreen';
import TareasScreen         from '../screens/TareasScreen';
import SubirTareaScreen     from '../screens/SubirTareaScreen';
import NotasScreen          from '../screens/NotasScreen';
import AsistenciaScreen     from '../screens/AsistenciaScreen';
import DetalleMaterialScreen from '../screens/DetalleMaterialScreen';
import PerfilScreen         from '../screens/PerfilScreen';
import EstudiantesScreen    from '../screens/EstudiantesScreen';

import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminUsuariosScreen  from '../screens/AdminUsuariosScreen';
import AdminClasesScreen    from '../screens/AdminClasesScreen';
import AdminReportesScreen  from '../screens/AdminReportesScreen';

const Stack = createNativeStackNavigator();

// Pantalla de carga mientras se restaura la sesión guardada
function SplashLoading() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

export default function AppNavigator() {

  const { usuario, loading } = useAuth();

  // Mientras se verifica si hay sesión persistida en AsyncStorage
  if (loading) {
    return <SplashLoading />;
  }

  // Pantalla inicial del área privada según el rol
  const rutaPrivadaInicial =
    usuario?.rol === 'administrador' ? 'AdminDashboard' :
    usuario?.rol === 'docente'       ? 'Dashboard' :
                                       'ClasesList';

  return (
    <Stack.Navigator
      // La key fuerza un remonte limpio del navigator al cambiar de sesión/rol,
      // así initialRouteName se respeta siempre (login, logout, cambio de rol).
      key={usuario ? `priv-${usuario.rol}` : 'pub'}
      initialRouteName={usuario ? rutaPrivadaInicial : 'Home'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >

      {!usuario ? (
        // ─────────────── STACK PÚBLICO ───────────────
        <Stack.Group>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerShown: true,
              headerTransparent: true,
              headerTitle: '',
              headerTintColor: '#dfe4ff'
            }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              headerShown: true,
              headerTransparent: true,
              headerTitle: '',
              headerTintColor: '#dfe4ff'
            }}
          />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>

      ) : (
        // ─────────────── STACK PRIVADO ───────────────
        <Stack.Group>
          <Stack.Screen name="Dashboard"       component={DashboardScreen} />
          <Stack.Screen name="ClasesList"      component={ClasesListScreen} />
          <Stack.Screen name="DetalleClase"    component={DetalleClaseScreen} />
          <Stack.Screen name="Materiales"      component={MaterialesScreen} />
          <Stack.Screen name="DetalleMaterial" component={DetalleMaterialScreen} />
          <Stack.Screen name="Tareas"          component={TareasScreen} />
          <Stack.Screen name="SubirTarea"      component={SubirTareaScreen} />
          <Stack.Screen name="Notas"           component={NotasScreen} />
          <Stack.Screen name="Asistencia"      component={AsistenciaScreen} />
          <Stack.Screen name="Perfil"          component={PerfilScreen} />
          <Stack.Screen name="EntregasTarea"   component={EntregasTareaScreen} />
          <Stack.Screen name="Estudiantes"     component={EstudiantesScreen} />

          <Stack.Screen name="AdminDashboard"  component={AdminDashboardScreen} />
          <Stack.Screen name="AdminUsuarios"   component={AdminUsuariosScreen} />
          <Stack.Screen name="AdminClases"     component={AdminClasesScreen} />
          <Stack.Screen name="AdminReportes"   component={AdminReportesScreen} />
        </Stack.Group>
      )}

    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
