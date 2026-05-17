// ===============================
// DashboardScreen.jsx
// ===============================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardScreen({ navigation }) {

  const { logout, usuario } = useAuth();

  const esDocente = usuario?.rol === 'docente';

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
              routes: [{ name: "Home" }],
            });

          }
        }
      ]
    );
  };

  // ===============================
  // CARDS SEGÚN EL ROL
  // ===============================

  const cards = [
    {
      title: "Mis clases",
      desc: esDocente ? "Administra tus clases creadas." : "Mira las clases en las que estás inscrito.",
      image: "https://cdn-icons-png.flaticon.com/512/3135/3135755.png",
      icon: "book-open-page-variant",
      route: "ClasesList"
    },
    {
      title: "Mi perfil",
      desc: "Visualiza tu información y configuración.",
      image: "https://cdn-icons-png.flaticon.com/512/201/201818.png",
      icon: "account-circle",
      route: "Perfil"
    }
  ];

  if (!esDocente) {
    cards.splice(1, 0, {
      title: "Mis notas",
      desc: "Consulta tu promedio y calificaciones.",
      image: "https://cdn-icons-png.flaticon.com/512/2436/2436636.png",
      icon: "star-circle-outline",
      route: "Notas"
    });
  }

  return (

    <SafeAreaView style={styles.container}>

      {/* HEADER (Solo docente) */}
      {esDocente && (
        <View style={styles.header}>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons
              name="logout"
              size={22}
              color="#fff"
            />
          </TouchableOpacity>

        </View>
      )}


      <ScrollView showsVerticalScrollIndicator={false}>

        {/* BANNER */}
        <View style={styles.bannerContainer}>

          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f'
            }}
            style={styles.banner}
          />

          <View style={styles.overlay}>
            <Text style={styles.bannerTitle}>
              Bienvenido a Educational Control
            </Text>
          </View>

        </View>


        {/* CARDS */}
        <View style={styles.cardsContainer}>

          {cards.map((item, index) => (

            <TouchableOpacity
              key={index}
              style={styles.card}
              onPress={() => navigation.navigate(item.route)}
            >

              <Image
                source={{ uri: item.image }}
                style={styles.cardImage}
              />

              <View style={styles.cardContent}>

                <View style={styles.cardTitleRow}>

                  <MaterialCommunityIcons
                    name={item.icon}
                    size={18}
                    color={Colors.primary}
                  />

                  <Text style={styles.cardTitle}>
                    {item.title}
                  </Text>

                </View>

                <Text style={styles.cardDesc}>
                  {item.desc}
                </Text>

              </View>

            </TouchableOpacity>

          ))}

        </View>

      </ScrollView>


      {/* NAVBAR */}
      <View style={styles.bottomNav}>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <MaterialCommunityIcons
            name="home-outline"
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.navTextActive}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('ClasesList')}
        >
          <MaterialCommunityIcons
            name="book-outline"
            size={24}
            color="#777"
          />
          <Text style={styles.navText}>Clases</Text>
        </TouchableOpacity>

        {!esDocente && (
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Perfil')}
          >
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={24}
              color="#777"
            />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.navItem}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color="#777"
          />
          <Text style={styles.navText}>Cerrar sesión</Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },

  header: {
    height: 70,
    backgroundColor: '#0B2C74',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerContainer: {
    position: 'relative',
  },

  banner: {
    width: '100%',
    height: 170,
  },

  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  bannerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  cardsContainer: {
    padding: 15,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    flexDirection: 'row',
    padding: 12,
    elevation: 3,
    alignItems: 'center',
    marginBottom: 15,
  },

  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },

  cardContent: {
    flex: 1,
    marginLeft: 15,
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 6,
  },

  cardDesc: {
    color: '#666',
    lineHeight: 20,
  },

  bottomNav: {
    height: 75,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
  },

  navItem: {
    alignItems: 'center',
  },

  navText: {
    fontSize: 12,
    color: '#777',
    marginTop: 3,
  },

  navTextActive: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 3,
  },

});