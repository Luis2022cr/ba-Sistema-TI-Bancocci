import { Request, Response } from 'express';
import pool from '../database/mysql';


export const getExpediente = async (req: Request, res: Response): Promise<void> => {
    try {
        const [expediente_prestamos]: any = await pool.query(`SELECT 
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
`);
        res.status(200).json(expediente_prestamos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los expedientes' });
    }
};

export const getExpedientePorNumeroCliente = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
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

/*
export const getExpedientesDeBaja = async (req: Request, res: Response): Promise<void> => {
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
        const [expediente_prestamos] = await pool.query(query);

        // Devolvemos los resultados
        res.status(200).json(expediente_prestamos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los expedientes por estado' });
    }
};

*/

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

        console.log(req.body, userId)
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