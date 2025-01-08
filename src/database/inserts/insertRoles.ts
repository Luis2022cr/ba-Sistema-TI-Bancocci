import { Connection } from 'mysql2/promise';

// Función para insertar roles solo si no existen
export const insertRolesIfNotExists = async (connection: Connection) => {
  // Roles que queremos verificar e insertar
  const rolesToCheck = ['admin', 'empleado', 'inactivo', 'prestamos'];

  // Verificar cuántos de los roles ya existen
  const checkRolesSQL = `
    SELECT COUNT(*) as count FROM rol WHERE descripcion IN (${rolesToCheck.map(() => '?').join(', ')});
  `;

  // Ejecutar consulta para verificar los roles existentes
  const [rows]: any = await connection.query(checkRolesSQL, rolesToCheck);

  // Si no hay roles existentes, proceder a insertarlos
  if (rows[0].count === 0) {
    const insertRolesSQL = `
      INSERT INTO rol (descripcion) VALUES 
      ${rolesToCheck.map(() => '(?)').join(', ')};
    `;

    await connection.query(insertRolesSQL, rolesToCheck);
    console.log('Roles insertados:', rolesToCheck);
  } else {
    console.log('Algunos roles ya existen, no se realizará la inserción.');
  }
};
