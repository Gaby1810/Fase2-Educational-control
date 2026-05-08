import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importaciones existentes
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ClasesListScreen from '../screens/ClasesListScreen'; 

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
          headerTintColor: '#dfe4ff',
        }}
      />

      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerTintColor: '#dfe4ff',
        }}
      />
      
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
      />

      {/* --- NUEVA RUTA REGISTRADA --- */}
      <Stack.Screen
        name="ClasesList"
        component={ClasesListScreen}
      />

      <Stack.Screen 
      name="DetalleMateria" 
      component={DetalleMateriaScreen} />

    </Stack.Navigator>
  );
}