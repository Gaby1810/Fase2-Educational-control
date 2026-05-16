// ===============================
// AdminUsuariosScreen.js
// Directorio de usuarios para el Administrador
// ===============================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { get, put, del } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const NAVY = '#0B2C74';
const LIGHT_BG = '#F5F6FA';

const ROL_COLOR = {
  docente:       { bg: '#4F46E5', text: '#fff' },
  estudiante:    { bg: '#F59E0B', text: '#fff' },
  administrador: { bg: '#EF4444', text: '#fff' },
};

const FILTROS = ['todos', 'docente', 'estudiante', 'administrador'];

export default function AdminUsuariosScreen({ navigation, route }) {

  const filtroInicial = route?.params?.filtroInicial ?? 'todos';

  const [usuarios, setUsuarios]   = useState([]);
  const [filtro, setFiltro]       = useState(filtroInicial);
  const [busqueda, setBusqueda]   = useState('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal editar
  const [modalVisible, setModalVisible]   = useState(false);
  const [usuarioEdit, setUsuarioEdit]     = useState(null);
  const [editNombre, setEditNombre]       = useState('');
  const [editCorreo, setEditCorreo]       = useState('');
  const [editRol, setEditRol]             = useState('');
  const [guardando, setGuardando]         = useState(false);

  const cargar = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filtro !== 'todos') params.append('rol', filtro);
      if (busqueda)           params.append('busqueda', busqueda);

      const data = await get(`/admin/usuarios?${params.toString()}`);
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filtro, busqueda]);

  useEffect(() => { cargar(); }, [cargar]);

  const onRefresh = () => { setRefreshing(true); cargar(); };

  // ---- Abrir modal editar ----
  const abrirEditar = (u) => {
    setUsuarioEdit(u);
    setEditNombre(u.nombre);
    setEditCorreo(u.correo);
    setEditRol(u.rol);
    setModalVisible(true);
  };

  const guardarEdicion = async () => {
    if (!editNombre.trim() || !editCorreo.trim()) {
      Alert.alert('Atención', 'Nombre y correo son obligatorios');
      return;
    }
    setGuardando(true);
    try {
      await put(`/admin/usuarios/${usuarioEdit.id}`, {
        nombre: editNombre,
        correo: editCorreo,
        rol: editRol,
      });
      setModalVisible(false);
      cargar();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setGuardando(false);
    }
  };

  // ---- Eliminar ----
  const confirmarEliminar = (u) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await del(`/admin/usuarios/${u.id}`);
              cargar();
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const iniciales = (nombre = '') =>
    nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

  const colorAvatar = (rol) => {
    const map = {
      docente: '#4F46E5',
      estudiante: '#F59E0B',
      administrador: '#EF4444',
    };
    return map[rol] || '#888';
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Directorio de usuarios</Text>
        <TouchableOpacity onPress={cargar}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* BUSQUEDA */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#aaa" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o email..."
          placeholderTextColor="#bbb"
          value={busqueda}
          onChangeText={setBusqueda}
          onSubmitEditing={cargar}
          returnKeyType="search"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={18} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {/* FILTROS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtrosScroll}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {FILTROS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroBtn, filtro === f && styles.filtroBtnActive]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroTxt, filtro === f && styles.filtroTxtActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CONTEO */}
      <Text style={styles.conteo}>
        DIRECTORIO DE USUARIOS — {usuarios.length} TOTAL
      </Text>

      {/* LISTA */}
      {loading ? (
        <ActivityIndicator size="large" color={NAVY} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: 30, paddingHorizontal: 16 }}
        >
          {usuarios.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={50} color="#ccc" />
              <Text style={styles.emptyTxt}>No se encontraron usuarios</Text>
            </View>
          ) : (
            usuarios.map(u => {
              const rc = ROL_COLOR[u.rol] ?? { bg: '#888', text: '#fff' };
              return (
                <View key={u.id} style={styles.userCard}>

                  {/* Avatar + info */}
                  <View style={styles.userTop}>
                    <View style={[styles.avatar, { backgroundColor: colorAvatar(u.rol) }]}>
                      <Text style={styles.avatarTxt}>{iniciales(u.nombre)}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{u.nombre}</Text>
                      <Text style={styles.userEmail}>{u.correo}</Text>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: rc.bg }]}>
                          <Text style={[styles.badgeTxt, { color: rc.text }]}>
                            {u.rol}
                          </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: '#E6FAF0' }]}>
                          <Text style={[styles.badgeTxt, { color: '#1B7A3E' }]}>Activo</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="ellipsis-vertical" size={18} color="#bbb" />
                  </View>

                  {/* Acciones */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => abrirEditar(u)}>
                      <Ionicons name="pencil-outline" size={15} color="#555" />
                      <Text style={styles.actionTxt}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.actionBtnDanger]}
                      onPress={() => confirmarEliminar(u)}
                    >
                      <Ionicons name="trash-outline" size={15} color="#E53935" />
                      <Text style={[styles.actionTxt, { color: '#E53935' }]}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>

                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* MODAL EDITAR */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Editar usuario</Text>

            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.fieldInput}
              value={editNombre}
              onChangeText={setEditNombre}
              placeholder="Nombre completo"
            />

            <Text style={styles.fieldLabel}>Correo</Text>
            <TextInput
              style={styles.fieldInput}
              value={editCorreo}
              onChangeText={setEditCorreo}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Rol</Text>
            <View style={styles.rolSelector}>
              {['docente', 'estudiante', 'administrador'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rolBtn, editRol === r && styles.rolBtnActive]}
                  onPress={() => setEditRol(r)}
                >
                  <Text style={[styles.rolBtnTxt, editRol === r && { color: '#fff' }]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelarTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnGuardar}
                onPress={guardarEdicion}
                disabled={guardando}
              >
                {guardando
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.btnGuardarTxt}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAV */}
      <View style={styles.bottomNav}>
        <NavItem icon="home-outline"      label="Inicio"   onPress={() => navigation.navigate('AdminDashboard')} />
        <NavItem icon="book-outline"      label="Clases"   onPress={() => navigation.navigate('AdminClases')} />
        <NavItem icon="people"            label="Usuarios" active />
        <NavItem icon="bar-chart-outline" label="Reportes" onPress={() => navigation.navigate('AdminReportes')} />
      </View>

    </SafeAreaView>
  );
}

function NavItem({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={active ? NAVY : '#888'} />
      <Text style={[styles.navLabel, active && { color: NAVY }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: LIGHT_BG },
  header: {
    height: 60, backgroundColor: NAVY,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: 14, backgroundColor: '#fff',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#222' },

  filtrosScroll:  { maxHeight: 44, marginBottom: 2 },
  filtroBtn:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eee' },
  filtroBtnActive:{ backgroundColor: NAVY },
  filtroTxt:      { fontSize: 13, color: '#555' },
  filtroTxtActive:{ color: '#fff', fontWeight: '600' },

  conteo: { fontSize: 11, color: '#999', fontWeight: '600', paddingHorizontal: 16, marginVertical: 8 },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyTxt: { color: '#aaa', marginTop: 10, fontSize: 14 },

  userCard: {
    backgroundColor: '#fff', borderRadius: 14,
    marginBottom: 12, padding: 14, elevation: 2,
  },
  userTop:   { flexDirection: 'row', alignItems: 'flex-start' },
  avatar:    { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  userInfo:  { flex: 1 },
  userName:  { fontSize: 15, fontWeight: '700', color: '#111' },
  userEmail: { fontSize: 12, color: '#888', marginTop: 2 },
  badgeRow:  { flexDirection: 'row', gap: 6, marginTop: 6 },
  badge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeTxt:  { fontSize: 11, fontWeight: '600' },

  actionsRow: {
    flexDirection: 'row', gap: 10, marginTop: 12,
    paddingTop: 10, borderTopWidth: 1, borderColor: '#f0f0f0',
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd',
  },
  actionBtnDanger: { borderColor: '#FFCDD2' },
  actionTxt: { fontSize: 13, color: '#555' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 36,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: '#555', marginBottom: 4, marginTop: 10 },
  fieldInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#222',
  },
  rolSelector: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  rolBtn:      { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  rolBtnActive:{ backgroundColor: NAVY, borderColor: NAVY },
  rolBtnTxt:   { fontSize: 13, color: '#555' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btnCancelar: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#f5f5f5', alignItems: 'center',
  },
  btnCancelarTxt: { color: '#555', fontWeight: '600' },
  btnGuardar: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: NAVY, alignItems: 'center',
  },
  btnGuardarTxt: { color: '#fff', fontWeight: '700' },

  bottomNav: {
    height: 70, backgroundColor: '#fff',
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'center', borderTopWidth: 1, borderColor: '#eee',
  },
  navItem:  { alignItems: 'center' },
  navLabel: { fontSize: 11, color: '#888', marginTop: 3 },
});