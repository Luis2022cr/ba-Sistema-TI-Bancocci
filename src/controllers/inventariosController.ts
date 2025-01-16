import { Request, Response } from 'express';
import pool from '../database/mysql';

// Obtener todos los inventarios
export const getInventarios = async (req: Request, res: Response): Promise<void> => {
    try {
        // Extraemos los posibles filtros desde los query params
        const { tipo_inventario_id } = req.query;

        // Base query
        let query = `
            SELECT 
                i.id, i.codigo, i.serie, i.comentarios, i.fecha_creacion, i.fecha_modificacion, 
                ti.nombre AS tipo_inventario, m.nombre AS marca, md.nombre as modelo, ag_origen.nombre AS agencia_origen, 
                ag_actual.nombre AS agencia_actual, ag_origen.codigo AS codigo_agencia_origen, 
                ag_actual.codigo AS codigo_agencia_actual, est.nombre AS estado, u.nombre AS usuario
            FROM inventario i
            JOIN tipo_inventario ti ON i.tipo_inventario_id = ti.id
            JOIN marca m ON i.marca_id = m.id
            JOIN modelo md ON i.modelo_id = md.id
            JOIN agencias ag_origen ON i.agencias_id_origen = ag_origen.id
            JOIN agencias ag_actual ON i.agencias_id_actual = ag_actual.id
            JOIN estado est ON i.estado_id = est.id
            JOIN usuario u ON i.usuario_id = u.id
            WHERE i.estado_id != 4
        `;

        // Array para los valores que pasaremos a la consulta
        const queryParams: any[] = [];

        // Si se pasa un tipo_inventario_id, añadimos la cláusula correspondiente
        if (tipo_inventario_id) {
            // Si el tipo_inventario_id es 9, se filtra solo para tipo 9
            if (parseInt(tipo_inventario_id as string) === 9) {
                query += ` AND i.tipo_inventario_id >= 9`; // Solo muestra inventarios de tipo 9
            } else {
                // Si el tipo_inventario_id no es 9, solo muestra los inventarios de ese tipo específico
                query += ` AND i.tipo_inventario_id = ?`; // Filtro para el tipo específico
                queryParams.push(tipo_inventario_id); // Agregamos el valor del tipo_inventario_id
            }
        }

        // Ejecutamos la consulta con los parámetros
        const [inventarios] = await pool.query(query, queryParams);

        // Devolvemos los resultados
        res.status(200).json(inventarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los inventarios' });
    }
};



export const getInventarioPorEstadoOnsoleto = async (req: Request, res: Response): Promise<void> => {
    try {
        // Base query para filtrar por estado
        const query = `
            SELECT 
                i.id, i.codigo, i.serie, i.comentarios, i.fecha_creacion, i.fecha_modificacion, 
                ti.nombre AS tipo_inventario, m.nombre AS marca, md.nombre as modelo, ag_origen.nombre AS agencia_origen, 
                ag_actual.nombre AS agencia_actual, ag_origen.codigo AS codigo_agencia_origen, est.nombre AS estado, u.nombre AS usuario
            FROM inventario i
            JOIN tipo_inventario ti ON i.tipo_inventario_id = ti.id
            JOIN marca m ON i.marca_id = m.id
            JOIN modelo md ON i.modelo_id = md.id
            JOIN agencias ag_origen ON i.agencias_id_origen = ag_origen.id
            JOIN agencias ag_actual ON i.agencias_id_actual = ag_actual.id
            JOIN estado est ON i.estado_id = est.id
            JOIN usuario u ON i.usuario_id = u.id
            WHERE i.estado_id = 4
        `;

        // Ejecutamos la consulta con el estado_id como parámetro
        const [inventarios] = await pool.query(query);

        // Devolvemos los resultados
        res.status(200).json(inventarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los inventarios por estado' });
    }
};



// Obtener inventario por ID
export const getInventarioPorId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const [inventario]: any = await pool.query(`
              SELECT i.*, 
                   ti.nombre AS tipo_inventario, m.nombre AS marca,  md.nombre as modelo,
                   ag_origen.nombre AS agencia_origen, ag_actual.nombre AS agencia_actual, 
                   est.nombre AS estado, u.nombre AS usuario
            FROM inventario i
            JOIN tipo_inventario ti ON i.tipo_inventario_id = ti.id
            JOIN marca m ON i.marca_id = m.id
            JOIN modelo md ON i.modelo_id = md.id
            JOIN agencias ag_origen ON i.agencias_id_origen = ag_origen.id
            JOIN agencias ag_actual ON i.agencias_id_actual = ag_actual.id
            JOIN estado est ON i.estado_id = est.id
            JOIN usuario u ON i.usuario_id = u.id
            WHERE i.id = ?
        `, [id]);

        if (inventario.length > 0) {
            res.status(200).json(inventario[0]);
        } else {
            res.status(404).json({ error: 'Inventario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el inventario' });
    }
};

export const getInventarioPorIdConHistorial = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const [inventario]: any = await pool.query(`
        SELECT i.*,
            ti.nombre AS "tipo_inventario", 
            m.nombre AS "marca", 
            mo.nombre AS "modelo", 
            ag_origen.nombre AS "agencia_origen", 
            ag_actual.nombre AS "agencia_actual", 
            e.nombre AS "estado", 
            u.nombre AS "usuario"
        FROM inventario i
        JOIN tipo_inventario ti ON i.tipo_inventario_id = ti.id
        JOIN marca m ON i.marca_id = m.id
        JOIN modelo mo ON i.modelo_id = mo.id  
        JOIN agencias ag_origen ON i.agencias_id_origen = ag_origen.id
        JOIN agencias ag_actual ON i.agencias_id_actual = ag_actual.id
        JOIN estado e ON i.estado_id = e.id
        JOIN usuario u ON i.usuario_id = u.id
        WHERE i.id = ?;
        `, [id]);

        if (inventario.length === 0) {
            res.status(404).json({ error: 'Inventario no encontrada' });
            return;
        }

        const [historial]: any = await pool.query(`
            SELECT 
                hci.cambio_realizado,
                hci.fecha_cambio, 
                hci.usuario_id,
                u.usuario AS usuario
            FROM 
                historial_cambio_inventario hci
            JOIN 
                usuario u ON hci.usuario_id = u.id
            WHERE 
                hci.inventario_id = ?
                AND hci.fecha_cambio >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH);
        `, [id]);

        const inventarioConHistorial = {
            ...inventario[0],
            historial: historial
        };

        res.status(200).json(inventarioConHistorial);

    } catch (error) {
        console.error('Error al obtener el Inventario con historial:', error);
        res.status(500).json({ error: 'Error al obtener el Inventario con historial' });
    }
};

export const getInventariosPorTipoConHistorial = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tipo_inventario_id } = req.params;

        // Ejecutamos la consulta SQL filtrada por tipo_inventario_id
        const [inventarios]: any = await pool.query(`
        SELECT 
            i.id AS "inventario_id",
            i.codigo,
            i.serie,
            i.tipo_inventario_id,
            i.marca_id,
            i.modelo_id,
            i.agencias_id_origen,
            i.agencias_id_actual,
            i.estado_id,
            i.usuario_id,
            i.comentarios,
            i.fecha_creacion,
            i.fecha_modificacion,
            ti.nombre AS "tipo_inventario", 
            m.nombre AS "marca", 
            mo.nombre AS "modelo", 
            ag_origen.nombre AS "agencia_origen", 
            ag_actual.nombre AS "agencia_actual", 
            e.nombre AS "estado", 
            u.nombre AS "usuario",
            hci.cambio_realizado,
            hci.fecha_cambio,
            hci.usuario_id AS "historial_usuario_id",
            hu.usuario AS "historial_usuario"
        FROM 
            inventario i
        JOIN tipo_inventario ti ON i.tipo_inventario_id = ti.id
        JOIN marca m ON i.marca_id = m.id
        JOIN modelo mo ON i.modelo_id = mo.id  
        JOIN agencias ag_origen ON i.agencias_id_origen = ag_origen.id
        JOIN agencias ag_actual ON i.agencias_id_actual = ag_actual.id
        JOIN estado e ON i.estado_id = e.id
        JOIN usuario u ON i.usuario_id = u.id
        LEFT JOIN historial_cambio_inventario hci ON hci.inventario_id = i.id
        LEFT JOIN usuario hu ON hci.usuario_id = hu.id
        WHERE i.tipo_inventario_id = ?
        AND hci.fecha_cambio >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        ORDER BY i.id, hci.fecha_cambio;
      `, [tipo_inventario_id]);

        if (inventarios.length === 0) {
            res.status(404).json({ error: 'No se encontraron inventarios para el tipo de inventario especificado' });
            return;
        }

        // Procesar el resultado para agrupar los historiales por inventario
        const inventariosConHistorial = inventarios.reduce((acc: any[], inventario: any) => {
            const { inventario_id, ...rest } = inventario;

            // Verificar si el inventario ya existe en el acumulador
            let inventarioExistente = acc.find((item) => item.id === inventario_id);

            if (!inventarioExistente) {
                inventarioExistente = { id: inventario_id, historial: [] };
                acc.push(inventarioExistente);
            }

            // Agregar el historial
            inventarioExistente.historial.push({
                cambio_realizado: inventario.cambio_realizado,
                fecha_cambio: inventario.fecha_cambio,
                usuario: inventario.historial_usuario,
            });

            // Asignar información general del inventario (sin duplicados)
            Object.assign(inventarioExistente, rest);

            return acc;
        }, []);

        res.status(200).json(inventariosConHistorial);
    } catch (error) {
        console.error('Error al obtener los Inventarios con historial:', error);
        res.status(500).json({ error: 'Error al obtener los Inventarios con historial' });
    }
};

// Crear un nuevo inventario
export const crearInventario = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            codigo,
            serie,
            tipo_inventario_id,
            marca_id,
            modelo_id,
            agencias_id_origen,
            agencias_id_actual,
            estado_id,
            comentarios,
            fecha_creacion,
        } = req.body;

        const userId = (req as any).user?.id;

        // Validar que todos los campos obligatorios estén presentes
        if (
            !serie ||
            !tipo_inventario_id ||
            !marca_id ||
            !modelo_id ||
            !agencias_id_origen ||
            !agencias_id_actual ||
            !estado_id ||
            !userId
        ) {
            res.status(400).json({ error: 'Todos los campos obligatorios deben ser proporcionados' });
            return;
        }

        // Asignar valor a n_inventario
        const n_inventario = codigo || 'N / A';

        // Verificar si la serie ya existe o si el código no es 'N / A' y ya existe
        // Verificar si la serie ya existe o si el código no es 'N / A' y ya existe
        let inventarioExistente: any[];
        if (n_inventario !== 'N / A') {
            const [result]: [any[], any] = await pool.query(
                'SELECT id FROM inventario WHERE codigo = ? OR serie = ?',
                [n_inventario, serie]
            );
            inventarioExistente = result;
        } else {
            const [result]: [any[], any] = await pool.query('SELECT id FROM inventario WHERE serie = ?', [serie]);
            inventarioExistente = result;
        }

        if (inventarioExistente.length > 0) {
            res.status(400).json({ error: 'El código o la serie ya están registrados' });
            return;
        }

        // Verificar si los IDs de las agencias, estado, tipo, marca, modelo y usuario existen
        const [tipoInventario]: any = await pool.query('SELECT id FROM tipo_inventario WHERE id = ?', [tipo_inventario_id]);
        const [modelo]: any = await pool.query('SELECT id FROM modelo WHERE id = ?', [modelo_id]);
        const [marca]: any = await pool.query('SELECT id FROM marca WHERE id = ?', [marca_id]);
        const [estado]: any = await pool.query('SELECT id FROM estado WHERE id = ?', [estado_id]);
        const [usuario]: any = await pool.query('SELECT id FROM usuario WHERE id = ?', [userId]);

        if (tipoInventario.length === 0 || marca.length === 0 || estado.length === 0 || usuario.length === 0 || modelo.length === 0) {
            res.status(400).json({ error: 'ID de tipo, marca, modelo, estado o usuario no válido' });
            return;
        }

        // Crear el inventario
        await pool.query(
            `
            INSERT INTO inventario (codigo, serie, tipo_inventario_id, 
            marca_id, modelo_id, agencias_id_origen, agencias_id_actual, estado_id, usuario_id, comentarios, fecha_creacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
            [
                n_inventario,
                serie,
                tipo_inventario_id,
                marca_id,
                modelo_id,
                agencias_id_origen,
                agencias_id_actual,
                estado_id,
                userId,
                comentarios,
                fecha_creacion,
            ]
        );

        // Crear el log del inventario creado
        const descripcion = `Se creó un nuevo inventario con código: ${n_inventario}, serie: ${serie}.`;
        const cambioRealizado = `Código: ${n_inventario}, Serie: ${serie}, Tipo Inventario ID: ${tipo_inventario_id}, Marca ID: ${marca_id}, Modelo ID: ${modelo_id}, Agencia Origen ID: ${agencias_id_origen}, Agencia Actual ID: ${agencias_id_actual}, Estado ID: ${estado_id}, Fecha de creación: ${fecha_creacion}`;

        await pool.query(
            `
            INSERT INTO logs (descripcion, cambio_realizado, usuario_id)
            VALUES (?, ?, ?)
        `,
            [descripcion, cambioRealizado, userId]
        );

        res.status(201).json({ message: 'Inventario creado exitosamente' });
    } catch (error) {
        console.error('Error al crear el inventario:', error);
        res.status(500).json({ error: 'Error al crear el inventario' });
    }
};


export const actualizarInventario = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id; // ID del usuario autenticado
        const { id } = req.params;
        const { codigo, serie, tipo_inventario_id, marca_id, modelo_id, agencias_id_origen, agencias_id_actual, estado_id, comentarios, fecha_creacion } = req.body;

        // Validar que todos los campos estén presentes
        if (!codigo || !serie || !tipo_inventario_id || !marca_id || !modelo_id || !agencias_id_origen || !agencias_id_actual || !estado_id || !fecha_creacion) {
            res.status(400).json({ error: 'Todos los campos son obligatorios' });
            return;
        }

        // Verificar si el inventario ya existe con el mismo código o serie
        let inventarioExistente: any[];
        if (codigo !== 'N / A') {
            const [result]: [any[], any] = await pool.query(
                'SELECT id FROM inventario WHERE (codigo = ? OR serie = ?) AND id != ?',
                [codigo, serie, id]
            );

            inventarioExistente = result;
        } else {
            const [result]: [any[], any] = await pool.query('SELECT id FROM inventario WHERE serie = ? AND id != ?', [serie, id]);
            inventarioExistente = result;
        }

        if (inventarioExistente.length > 0) {
            res.status(400).json({ error: 'El código o la serie ya están registrados' });
            return;
        }


        // Obtener el inventario actual antes de actualizar
        const [inventarioActual]: any = await pool.query(`
            SELECT codigo, serie, tipo_inventario_id, marca_id, modelo_id, agencias_id_origen, agencias_id_actual, estado_id, comentarios, fecha_creacion
            FROM inventario
            WHERE id = ?
        `, [id]);

        if (inventarioActual.length === 0) {
            res.status(404).json({ error: 'Inventario no encontrado' });
            return;
        }

        const inventarioAnterior = inventarioActual[0];

        // Obtener nombres descriptivos para el inventario anterior y el nuevo
        const obtenerNombre = async (tabla: string, id: number) => {
            if (!id) return null;
            const [resultado]: any = await pool.query(`SELECT nombre FROM ${tabla} WHERE id = ?`, [id]);
            return resultado.length > 0 ? resultado[0].nombre : null;
        };

        const nombresAnterior = {
            tipo_inventario: await obtenerNombre('tipo_inventario', inventarioAnterior.tipo_inventario_id),
            marca: await obtenerNombre('marca', inventarioAnterior.marca_id),
            modelo: await obtenerNombre('modelo', inventarioAnterior.modelo_id),
            agencia_origen: await obtenerNombre('agencias', inventarioAnterior.agencias_id_origen),
            agencia_actual: await obtenerNombre('agencias', inventarioAnterior.agencias_id_actual),
            estado: await obtenerNombre('estado', inventarioAnterior.estado_id)
        };

        const nombresNuevo = {
            tipo_inventario: await obtenerNombre('tipo_inventario', tipo_inventario_id),
            marca: await obtenerNombre('marca', marca_id),
            modelo: await obtenerNombre('modelo', modelo_id),
            agencia_origen: await obtenerNombre('agencias', agencias_id_origen),
            agencia_actual: await obtenerNombre('agencias', agencias_id_actual),
            estado: await obtenerNombre('estado', estado_id)
        };

        // Actualizar el inventario
        const [result]: any = await pool.query(`
            UPDATE inventario
            SET codigo = ?, serie = ?, tipo_inventario_id = ?, marca_id = ?, modelo_id = ?, agencias_id_origen = ?, agencias_id_actual = ?, estado_id = ?, usuario_id = ?, comentarios = ?, fecha_creacion= ?
            WHERE id = ?
        `, [codigo, serie, tipo_inventario_id, marca_id, modelo_id, agencias_id_origen, agencias_id_actual, estado_id, userId, comentarios, fecha_creacion, id]);

        if (result.affectedRows > 0) {
            // Comparar los campos modificados y generar el log de cambios
            let cambios: string[] = [];

            // Función para registrar cambios
            const registrarCambio = (campo: string, valorAnterior: any, valorNuevo: any) => {
                if (valorAnterior !== valorNuevo) {
                    cambios.push(`${campo}: '${valorAnterior}' -> '${valorNuevo}'`);
                }
            };

            registrarCambio('Código', inventarioAnterior.codigo, codigo);
            registrarCambio('Serie', inventarioAnterior.serie, serie);
            registrarCambio('Tipo de Inventario', nombresAnterior.tipo_inventario, nombresNuevo.tipo_inventario);
            registrarCambio('Marca', nombresAnterior.marca, nombresNuevo.marca);
            registrarCambio('Modelo', nombresAnterior.modelo, nombresNuevo.modelo);
            registrarCambio('Agencia Origen', nombresAnterior.agencia_origen, nombresNuevo.agencia_origen);
            registrarCambio('Agencia Actual', nombresAnterior.agencia_actual, nombresNuevo.agencia_actual);
            registrarCambio('Estado', nombresAnterior.estado, nombresNuevo.estado);
            registrarCambio('Comentarios', inventarioAnterior.comentarios, comentarios);
            registrarCambio('Fecha de Instalacion', inventarioAnterior.fecha_creacion, fecha_creacion);

            // Generar la descripción y el cambio realizado para el log
            const descripcion = `Se actualizó el inventario con código: ${inventarioAnterior.codigo}.`;
            const cambioRealizado = cambios.length > 0 ? cambios.join(', ') : 'Sin cambios detectados';

            // Registrar el log si hubo cambios
            if (cambios.length > 0) {
                await pool.query(`
                    INSERT INTO logs (descripcion, cambio_realizado, usuario_id)
                    VALUES (?, ?, ?)
                `, [descripcion, cambioRealizado, userId]);
            }

            res.status(200).json({ message: 'Inventario actualizado exitosamente' });
        } else {
            res.status(404).json({ error: 'Inventario no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el inventario' });
    }
};