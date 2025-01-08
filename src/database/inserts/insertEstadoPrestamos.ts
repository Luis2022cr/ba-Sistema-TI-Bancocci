import { Connection } from 'mysql2/promise';

// Función para insertar los estados de UPS solo si no existen
export const insertEstadoPrestamosIfNotExists = async (connection: Connection) => {
  // Nombres de los estados que queremos verificar e insertar
  const estadosToCheck = ['Operativo', 'De baja'];

  // Verificar cuántos de los estados ya existen
  const checkEstadosSQL = `
    SELECT COUNT(*) as count FROM estado_prestamos WHERE nombre IN (${estadosToCheck.map(() => '?').join(', ')});
  `;

  // Ejecutar consulta para verificar los estados existentes
  const [rows]:any = await connection.query(checkEstadosSQL, estadosToCheck);

  // Si no hay estados existentes, proceder a insertarlos
  if (rows[0].count === 0) {
    const insertEstadosSQL = `
      INSERT INTO estado_prestamos (nombre) VALUES 
      ${estadosToCheck.map(() => '(?)').join(', ')};
    `;

    await connection.query(insertEstadosSQL, estadosToCheck);
    console.log('Estados de Prestamos insertados:', estadosToCheck);
  } else {
    console.log('Algunos estados de Prestamos ya existen, no se realizará la inserción.');
  }
};
