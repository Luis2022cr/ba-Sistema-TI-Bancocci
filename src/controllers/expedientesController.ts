import { Request, Response } from 'express';
import pool from '../database/mysql';


export const getExpediente = async (req: Request, res: Response): Promise<void> => {
    try {
        const [expediente_prestamos]: any = await pool.query(` select
 ep.id, ep.numero_cliente, ep.nombre_cliente,  ep.estado_id,  ep.agencia_id, ep.estante, 
    ep.columna,  ep.fila, ep.comentarios, ep.fecha_entrada, ep.fecha_salida, 
    ep.usuario_id, ep.responsable,
    esp.nombre  as estado ,
    a.nombre as agencia,
    u.nombre as usuario
FROM 
    expediente_prestamos ep
join estado_prestamos esp on ep.estado_id = esp.id 
join agencias a on ep.agencia_id  = a.id 
join usuario u  on ep.usuario_id  = u.id 
Where ep.estado_id = 1
`);
        res.status(200).json(expediente_prestamos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los expedientes' });
    }
};

export const getExpedientePorNumeroCliente = async (req: Request, res: Response): Promise<void> => {
    try {
        const { clienteId } = req.params;
        const [expediente_prestamos]: any = await pool.query(`
            SELECT 
                ep.id, ep.numero_cliente, ep.nombre_cliente,  ep.agencia_id, ep.estante, 
                ep.columna,  ep.fila, ep.comentarios, 
                ep.usuario_id, ep.responsable,
                a.nombre as agencia, 
                u.nombre as usuario
            FROM 
                expediente_prestamos ep
            join agencias a on ep.agencia_id  = a.id 
            join usuario u  on ep.usuario_id  = u.id 
            where ep.numero_cliente = ?
        `, [clienteId]);

        if (expediente_prestamos.length > 0) {
            res.status(200).json(expediente_prestamos[0]);
        } else {
            res.status(404).json({ error: 'expediente no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el expediente' });
    }
};


export const getExpedientePorId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const [expediente_prestamos]: any = await pool.query(`
            SELECT 
                ep.id, ep.numero_cliente, ep.nombre_cliente, ep.estado_id, ep.agencia_id, ep.estante, 
                ep.columna, ep.fila, ep.comentarios, 
                ep.responsable,
                a.nombre as agencia, 
                esp.nombre as estado
            FROM 
                expediente_prestamos ep
            join agencias a on ep.agencia_id  = a.id 
            join estado_prestamos esp  on ep.estado_id  = esp.id 
            where ep.id = ?

        `, [id]);

        if (expediente_prestamos.length > 0) {
            res.status(200).json(expediente_prestamos[0]);
        } else {
            res.status(404).json({ error: 'expediente no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el expediente' });
    }
};


export const getExpedientesDeBaja = async (req: Request, res: Response): Promise<void> => {
    try {
        // Base query para filtrar por estado
        const query = `
            select
 ep.id, ep.numero_cliente, ep.nombre_cliente,  ep.estado_id,  ep.agencia_id, ep.estante, 
    ep.columna,  ep.fila, ep.comentarios, ep.fecha_entrada, ep.fecha_salida, 
    ep.usuario_id, ep.responsable,
    esp.nombre  as estado ,
    a.nombre as agencia,
    u.nombre as usuario
FROM 
    expediente_prestamos ep
join estado_prestamos esp on ep.estado_id = esp.id 
join agencias a on ep.agencia_id  = a.id 
join usuario u  on ep.usuario_id  = u.id 
Where ep.estado_id = 2
        `;

        // Ejecutamos la consulta con el estado_id como parámetro
        const [expediente_prestamos] = await pool.query(query);

        // Devolvemos los resultados
        res.status(200).json(expediente_prestamos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los expedientes por estado' });
    }
};

export const crearExpediente = async (req: Request, res: Response): Promise<void> => {
    try {
        const { numero_cliente, nombre_cliente, estado_id, agencia_id, estante,
            columna, fila, comentarios, responsable } = req.body;
        const userId = (req as any).user?.id;


        // Validar que todos los campos estén presentes
        if (!numero_cliente || !nombre_cliente || !estado_id || !agencia_id || !estante || !columna ||
            !fila || !userId || !responsable) {
            res.status(400).json({ error: 'Todos los campos son obligatorios' });
            return;
        }
        // Verificar si el código ya existen
        const [expedienteExistente]: any = await pool.query(
            'SELECT id FROM expediente_prestamos WHERE numero_cliente = ?',
            [numero_cliente]
        );

        if (expedienteExistente.length > 0) {
            res.status(400).json({ error: 'El Numero de expediente ya están registrados' });
            return;
        }


        // Verificar si los IDs de las agencias, estado, tipo y usuario existen
        const [estado]: any = await pool.query('SELECT id FROM estado_prestamos WHERE id = ?', [estado_id]);
        const [usuario]: any = await pool.query('SELECT id FROM usuario WHERE id = ?', [userId]);

        if (estado.length === 0 || usuario.length === 0) {
            res.status(400).json({ error: 'ID de estado o usuario no válido' });
            return;
        }

        
        // Crear el inventario
        await pool.query(`
            INSERT INTO expediente_prestamos (numero_cliente, nombre_cliente, estado_id, agencia_id, estante,
            columna, fila, comentarios, usuario_id, responsable)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [numero_cliente, nombre_cliente, estado_id, agencia_id, estante,
            columna, fila, comentarios, userId, responsable]);

        // Crear el log del expediente creado
        const descripcion = `Se creó un nuevo expediente con Número Cliente: ${numero_cliente}, nombre cliente: ${nombre_cliente}.`;
        const cambioRealizado = `Número Cliente: ${numero_cliente}, Nombre Cliente: ${nombre_cliente}, 
        Estante: ${estante}, Columna: ${columna}, Fila: ${fila}, Agencia: ${agencia_id}, Estado ID: ${estado_id}}
        `;

        await pool.query(`
            INSERT INTO logs (descripcion, cambio_realizado, usuario_id)
            VALUES (?, ?, ?)
        `, [descripcion, cambioRealizado, userId]);

        res.status(201).json({ message: 'Expediente creado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el Expediente' });
    }
};

export const actualizarExpediente = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id; // ID del usuario autenticado
        const { id } = req.params;
        const { numero_cliente, nombre_cliente, estado_id, agencia_id, estante,
            columna, fila, comentarios, responsable } = req.body;

        // Validar que todos los campos estén presentes
        if (!numero_cliente || !nombre_cliente || !estado_id || !agencia_id || !estante || !columna
             || !fila || !comentarios || !responsable) {
            res.status(400).json({ error: 'Todos los campos son obligatorios' });
            return;
        }

        // Obtener el expediente actual antes de actualizar
        const [expedienteActual]: any = await pool.query(`
            SELECT numero_cliente, nombre_cliente, estado_id, agencia_id, estante,
            columna, fila, comentarios, responsable
            FROM expediente_prestamos
            WHERE numero_cliente = ?
        `, [numero_cliente]);

        
        if (expedienteActual.length === 0) {
            res.status(404).json({ error: 'Expediente no encontrado' });
            return;
        }

        const expedienteAnterior = expedienteActual[0];

        // Validar que el numero_cliente no esté siendo cambiado a uno que ya existe
        if (numero_cliente !== expedienteAnterior.numero_cliente) {
            const [expedienteExistente]: any = await pool.query(
                'SELECT id FROM expediente_prestamos WHERE numero_cliente = ? AND id != ?',
                [numero_cliente, id]
            );
        
            if (expedienteExistente.length > 0) {
                res.status(400).json({ error: 'El número de cliente ya está registrado en otro expediente' });
                return;
            }
        }

        // Obtener nombres descriptivos para el expediente anterior y el nuevo
        const obtenerNombre = async (tabla: string, id: number) => {
            if (!id) return null;
            const [resultado]: any = await pool.query(`SELECT nombre FROM ${tabla} WHERE id = ?`, [id]);
            return resultado.length > 0 ? resultado[0].nombre : null;
        };

        const nombresAnterior = {
            estado: await obtenerNombre('estado_prestamos', expedienteAnterior.estado_id),
            agencia: await obtenerNombre('agencias', expedienteAnterior.agencia_id),
        };

        const nombresNuevo = {
            estado: await obtenerNombre('estado_prestamos', estado_id),
            agencia: await obtenerNombre('agencias', agencia_id),
        };

        // Actualizar el expediente
        const [result]: any = await pool.query(`
            UPDATE expediente_prestamos
            SET numero_cliente = ?, nombre_cliente = ?, estado_id = ?, agencia_id = ?, estante = ?,
            columna = ?, fila = ?, comentarios = ?, responsable = ?
            WHERE id = ?
        `, [numero_cliente, nombre_cliente, estado_id, agencia_id, estante,
            columna, fila, comentarios, responsable,
           userId, id]);

        if (result.affectedRows > 0) {
            // Comparar los campos modificados y generar el log de cambios
            let cambios: string[] = [];

            // Función para registrar cambios
            const registrarCambio = (campo: string, valorAnterior: any, valorNuevo: any) => {
                if (valorAnterior !== valorNuevo) {
                    cambios.push(`${campo}: '${valorAnterior}' -> '${valorNuevo}'`);
                }
            };

            registrarCambio('Número Cliente', expedienteAnterior.numero_cliente, numero_cliente);
            registrarCambio('Nombre Cliente', expedienteAnterior.nombre_cliente, nombre_cliente);
            registrarCambio('Estado Prestamo', nombresAnterior.estado, nombresNuevo.estado);
            registrarCambio('Agencia', nombresAnterior.agencia, nombresNuevo.agencia);
            registrarCambio('Estante', expedienteAnterior.estante, estante);
            registrarCambio('Columna', expedienteAnterior.columna, columna);
            registrarCambio('Fila', expedienteAnterior.fila, fila);
            registrarCambio('Comentarios', expedienteAnterior.comentarios, comentarios);
            registrarCambio('Responsable', expedienteAnterior.responsable, responsable);

            // Generar la descripción y el cambio realizado para el log
            const descripcion = `Se actualizó el expediente con código: ${expedienteAnterior.numero_cliente}.`;
            const cambioRealizado = cambios.length > 0 ? cambios.join(', ') : 'Sin cambios detectados';

            // Registrar el log si hubo cambios
            if (cambios.length > 0) {
                await pool.query(`
                    INSERT INTO logs (descripcion, cambio_realizado, usuario_id)
                    VALUES (?, ?, ?)
                `, [descripcion, cambioRealizado, userId]);
            }

            res.status(200).json({ message: 'Expediente actualizado exitosamente' });
        } else {
            res.status(404).json({ error: 'Expediente no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el expediente' });
    }
};
