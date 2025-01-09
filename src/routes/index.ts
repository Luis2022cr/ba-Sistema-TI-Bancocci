import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware'; //ejemplo de uso= router.get('/ejemplo', authenticateJWT, getEjemplo);
import { registro, login, cambiarContraseña, cambiarContraseñaPorAdmin } from '../controllers/authController';
import { getRoles } from '../controllers/rolController';
import { actualizarDepartamento, crearDepartamentos, getDepto, getDeptoPorId } from '../controllers/departamentoController';
import { getTipoTamano } from '../controllers/tipoTamanoController';
import { actualizarMarca, crearMarca, getMarca, getMarcaById } from '../controllers/marcaController';
import { getEstado, getLog } from '../controllers/estadoController';
import { getEstadoUps } from '../controllers/estadoUpsController';
import {  getTipoInventario } from '../controllers/tipoInventarioController';
import { actualizarHistorialCambioUPS, crearHistorialCambioUPS, obtenerHistorialCambioUPS } from '../controllers/historialCambioUpsController';
import { getPerfilUsuario, actualizarPerfilUsuario, getUsuarios, actualizarDatosUsuario, getUsuariosById } from '../controllers/usuarioController';
import { getEstadoAgencias } from '../controllers/estadoAgenciasController';
import { actualizarAgencias, crearAgencias, getAgencias, getAgenciasById } from '../controllers/agenciasController';
import { actualizarDirectorio, crearDirectorio, eliminarDirectorio, getDirectorios, getDirectoriosById } from '../controllers/directorioController';
import { getUps, crearUps, actualizarUps, eliminarUps, getUpsPorIdConHistorial, getUpsSelect, getcalendarUPS, getUpsById } from '../controllers/upsController';
import { getInventarios, getInventarioPorId, crearInventario, actualizarInventario, getInventarioPorIdConHistorial, getInventariosPorTipoConHistorial, getInventarioPorEstadoOnsoleto } from '../controllers/inventariosController';
import { actualizarModelo, crearModelo, getModelo, getModeloById } from '../controllers/modeloController';
import { getUpsMapa, createUpsMapa, deleteUpsMapa } from '../controllers/mapaController';
import { actualizarHistorialCambioInventario, crearHistorialCambioInventario, obtenerHistorialCambioInventario } from '../controllers/historialCambioInventarioController';
import { checkNotificacionesUps, getNotificacionesUps } from '../controllers/notificacionesController';
import { crearControlEquipo, obtenerReparacionesConEquipos, obtenerReparacionPorId } from '../controllers/ControlEquipoController';
import { importarInventario } from '../controllers/importExcelInventarioController';
import { crearExpediente, getExpediente, getExpedientePorNumeroCliente } from '../controllers/expedientesController';
import { getEstadoPrestamos } from '../controllers/estadoExpedientesController';
import { crearHistorialPrestamos, obtenerExpedientePrestamosConHistorial } from '../controllers/historialExpedienteController';

import multer from 'multer';

const router: Router = Router();

// Rutas de autenticación
router.post('/auth/registro',authenticateJWT, registro);
router.post('/auth/login', login);
router.put('/auth/cambio-contrasena',authenticateJWT, cambiarContraseña);
router.put('/auth/cambio-contrasena-admin/:id', cambiarContraseñaPorAdmin);

// rutas para Usuarios
router.get('/perfil/usuario',authenticateJWT, getPerfilUsuario);
router.put('/perfil/usuario',authenticateJWT, actualizarPerfilUsuario);
router.get('/usuarios', getUsuarios);
router.get('/usuarios/:id', getUsuariosById);
router.put('/usuarios/:id', actualizarDatosUsuario);

// Rutas de Roles
router.get('/roles', getRoles);

// Rutas de Tipo Inventario
router.get('/tipo_inventarios', getTipoInventario);

// Rutas de Departamentos
router.get('/departamentos', getDepto);
router.get('/departamento/:id', getDeptoPorId);
router.post('/crear_departamentos', crearDepartamentos);
router.put('/actualizar-departamento/:id', actualizarDepartamento);

// Rutas de Tipo Tamaño
router.get('/tipo_tamanos', getTipoTamano);
// Rutas de Marca
router.get('/marcas', getMarca);
router.get('/marca/:id', getMarcaById);
router.post('/crear_marcas', crearMarca);
router.put('/actualizar-marca/:id', actualizarMarca);

// Rutas de Marca
router.get('/modelos', getModelo);
router.get('/modelo/:id', getModeloById);
router.post('/crear_modelos', crearModelo);
router.put('/actualizar-modelo/:id', actualizarModelo);

// Rutas de Estado
router.get('/estados_inventarios', getEstado);

// Rutas de Estado UPS
router.get('/estado_ups', getEstadoUps);

// Rutas de Estado Agencias
router.get('/estado_agencias', getEstadoAgencias);

// Rutas para historial_cambio_ups
router.get('/historial_cambio_ups',authenticateJWT, obtenerHistorialCambioUPS);  
router.post('/historial_cambio_ups',authenticateJWT, crearHistorialCambioUPS);    
router.put('/historial_cambio_ups/:id',authenticateJWT, actualizarHistorialCambioUPS); 

// Rutas de Estado Agencias
router.get('/agencias', getAgencias);
router.get('/agencia/:id', getAgenciasById);
router.post('/crear_agencias',authenticateJWT, crearAgencias);
router.put('/actualizar-agencia/:id',authenticateJWT, actualizarAgencias);


// Rutas de Estado directorios
router.get('/directorios',authenticateJWT, getDirectorios);
router.get('/directorios/:id',authenticateJWT, getDirectoriosById);
router.post('/directorios',authenticateJWT, crearDirectorio);
router.put('/directorios/:id',authenticateJWT, actualizarDirectorio);
router.delete('/directorios/:id',authenticateJWT, eliminarDirectorio);

// Rutas de UPS
router.get('/ups', getUps);
router.get('/ups/:id', getUpsById); 
router.get('/ups-select', getUpsSelect);
router.get('/ups/:id/historial', getUpsPorIdConHistorial); 
router.post('/ups', authenticateJWT, crearUps);
router.put('/ups/:id',authenticateJWT, actualizarUps);
router.patch('/ups/:id/estado',authenticateJWT, eliminarUps);

//ruta para calendario
router.get('/calendario/ups', getcalendarUPS);

//LOGS
router.get('/logs',authenticateJWT, getLog);

// Rutas para el CRUD de UPS Mapa
router.get('/ups-mapa',authenticateJWT, getUpsMapa);
router.post('/ups-mapa',authenticateJWT, createUpsMapa);
router.delete('/ups-mapa/:id',authenticateJWT, deleteUpsMapa);

// Rutas de Inventarios
router.get('/inventarios',authenticateJWT, getInventarios);
router.get('/inventario_obsoleto',authenticateJWT, getInventarioPorEstadoOnsoleto);
router.get('/inventarios/:id',authenticateJWT, getInventarioPorId);
router.get('/inventario/:id',authenticateJWT, getInventarioPorIdConHistorial); 
router.post('/inventarios',authenticateJWT, crearInventario);
router.put('/inventarios/:id',authenticateJWT, actualizarInventario);
router.get('/inventarios/:tipo_inventario_id/historial',authenticateJWT, getInventariosPorTipoConHistorial);

// Rutas para historial_cambio_inventario
router.get('/historial_inventario',authenticateJWT, obtenerHistorialCambioInventario);  
router.post('/historial_inventario',authenticateJWT, authenticateJWT, crearHistorialCambioInventario);    
router.put('/historial_inventario/:id',authenticateJWT, actualizarHistorialCambioInventario); 

// Ruta para obtener las notificaciones
router.get('/notificaciones',authenticateJWT, getNotificacionesUps);  
router.get('/notificaciones/check',authenticateJWT, checkNotificacionesUps);  

// Ruta para obtener las control de equipo
router.post('/control_equipo_pdf',authenticateJWT, crearControlEquipo);  
router.get('/control_equipo',authenticateJWT, obtenerReparacionesConEquipos);  
router.get('/control_equipo/:id',authenticateJWT, obtenerReparacionPorId);  

// Ruta para cargar archivo excel de inventario
const upload = multer({ dest: 'uploads/' }); //
router.post('/importar-inventario',authenticateJWT,upload.single('file'),importarInventario);

//  Rutas para Modulo de prestamos
router.post('/historial_prestamos',authenticateJWT , crearHistorialPrestamos);  
router.get('/historial_prestamos/:id',authenticateJWT , obtenerExpedientePrestamosConHistorial);  

// Ruta para obtener los expedientes de equipo
router.post('/agregar_expedientes', authenticateJWT, crearExpediente );  
router.get('/expedientes', getExpediente);  
router.get('/expediente/:id', getExpedientePorNumeroCliente);  

// Rutas de Estado Prestamos
router.get('/estados_prestamos', getEstadoPrestamos);

export default router;
 