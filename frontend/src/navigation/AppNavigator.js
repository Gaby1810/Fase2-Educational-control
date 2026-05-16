// ===============================
// AppNavigator.js  — VERSIÓN COMPLETA CON ADMIN
// Reemplaza tu archivo: frontend/src/navigation/AppNavigator.js
// ===============================

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen           from '../screens/HomeScreen';
import LoginScreen          from '../screens/LoginScreen';
import RegisterScreen       from '../screens/RegisterScreen';
import DashboardScreen      from '../screens/DashboardScreen';
import ClasesListScreen     from '../screens/ClasesListScreen';
import DetalleClaseScreen   from '../screens/DetalleClaseScreen';
import MaterialesScreen     from '../screens/MaterialScreen';
import SubirMaterialScreen  from '../screens/SubirMaterialScreen';
import TareasScreen         from '../screens/TareasScreen';
import SubirTareaScreen     from '../screens/SubirTareaScreen';
import NotasScreen          from '../screens/NotasScreen';
import AsistenciaScreen     from '../screens/AsistenciaScreen';
import DetalleMaterialScreen from '../screens/DetalleMaterialScreen';
import PerfilScreen         from '../screens/PerfilScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

// ── NUEVAS PANTALLAS ADMIN ──────────────────────────────────
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminUsuariosScreen  from '../screens/AdminUsuariosScreen';
import AdminClasesScreen    from '../screens/AdminClasesScreen';
import AdminReportesScreen  from '../screens/AdminReportesScreen';
// ───────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >

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

      {/* ── DOCENTE / ESTUDIANTE ── */}
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
      <Stack.Screen name="SubirMaterial"   component={SubirMaterialScreen} />

      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />

      {/* ── ADMINISTRADOR ── */}
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminUsuarios"  component={AdminUsuariosScreen} />
      <Stack.Screen name="AdminClases"    component={AdminClasesScreen} />
      <Stack.Screen name="AdminReportes"  component={AdminReportesScreen} />

    </Stack.Navigator>
  );
}