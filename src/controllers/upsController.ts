import { Request, Response } from 'express';
import pool from '../database/mysql';

// Obtener todas las UPS
export const getUps = async (req: Request, res: Response): Promise<void> => {
    try {
        const [ups] = await pool.query(`
            SELECT u.id, u.nombre, u.modelo, u.direccion_ip, u.kva, u.fecha_instalacion, u.años_uso, u.proximo_cambio, u.modulos, u.baterias, u.observacion,
                   ag.nombre AS agencia, est.nombre AS estado_ups, tt.nombre AS tipo_tamano
            FROM ups u
            JOIN agencias ag ON u.agencias_id = ag.id
            JOIN estado_ups est ON u.estado_ups_id = est.id
            JOIN tipo_tamano tt ON u.tipo_tamano_id = tt.id
        `);
        res.status(200).json(ups);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las UPS' });
    }
};

// Obtener UPS por ID
export const getUpsPorId = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const [ups]: any = await pool.query(`
            SELECT u.id, u.nombre, u.modelo, u.direccion_ip, u.kva, u.fecha_instalacion, u.años_uso, u.proximo_cambio, u.modulos, u.baterias, u.observacion,
                   ag.nombre AS agencia, est.nombre AS estado_ups, tt.nombre AS tipo_tamano
            FROM ups u
            JOIN agencias ag ON u.agencias_id = ag.id
            JOIN estado_ups est ON u.estado_ups_id = est.id
            JOIN tipo_tamano tt ON u.tipo_tamano_id = tt.id
            WHERE u.id = ?
        `, [id]);

        if (ups.length > 0) {
            res.status(200).json(ups[0]);
        } else {
            res.status(404).json({ error: 'UPS no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la UPS' });
    }
};

// Crear una nueva UPS
export const crearUps = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user?.id; // ID del usuario autenticado
        const { nombre, modelo, direccion_ip, kva, fecha_instalacion, años_uso, proximo_cambio, modulos, baterias, agencias_id, estado_ups_id, tipo_tamano_id, observacion } = req.body;

        // Validar que todos los campos estén presentes
        if (!nombre || !modelo || !direccion_ip || !kva || !fecha_instalacion || !años_uso || !proximo_cambio || !modulos || !baterias || !agencias_id || !estado_ups_id || !tipo_tamano_id) {
            res.status(400).json({ error: 'Todos los campos son obligatorios' });
            return;
        }

        // Verificar si el estado_ups_id y tipo_tamano_id existen
        const [estado]: any = await pool.query('SELECT id FROM estado_ups WHERE id = ?', [estado_ups_id]);
        const [tipoTamano]: any = await pool.query('SELECT id FROM tipo_tamano WHERE id = ?', [tipo_tamano_id]);

        if (estado.length === 0) {
            res.status(400).json({ error: 'El estado proporcionado no existe' });
            return;
        }

        if (tipoTamano.length === 0) {
            res.status(400).json({ error: 'El tipo de tamaño proporcionado no existe' });
            return;
        }

        // Si el estado y tipo de tamaño existen, proceder a crear la UPS
        await pool.query(`
            INSERT INTO ups (nombre, modelo, direccion_ip, kva, fecha_instalacion, años_uso, proximo_cambio, modulos, baterias, agencias_id, estado_ups_id, tipo_tamano_id, observacion)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [nombre, modelo, direccion_ip, kva, fecha_instalacion, años_uso, proximo_cambio, modulos, baterias, agencias_id, estado_ups_id, tipo_tamano_id, observacion]
        );

        res.status(201).json({ message: 'UPS creada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear la UPS' });
    }
};

// Actualizar una UPS existente
export const actualizarUps = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { nombre, modelo, direccion_ip, kva, fecha_instalacion, años_uso, proximo_cambio, modulos, baterias, agencias_id, estado_ups_id, tipo_tamano_id, observacion } = req.body;

        // Validar que todos los campos estén presentes
        if (!nombre || !modelo || !direccion_ip || !kva || !fecha_instalacion || !años_uso || !proximo_cambio || !modulos || !baterias || !agencias_id || !estado_ups_id || !tipo_tamano_id) {
            res.status(400).json({ error: 'Todos los campos son obligatorios' });
            return;
        }

        // Verificar si el estado_ups_id y tipo_tamano_id existen
        const [estado]: any = await pool.query('SELECT id FROM estado_ups WHERE id = ?', [estado_ups_id]);
        const [tipoTamano]: any = await pool.query('SELECT id FROM tipo_tamano WHERE id = ?', [tipo_tamano_id]);

        if (estado.length === 0) {
            res.status(400).json({ error: 'El estado proporcionado no existe' });
            return;
        }

        if (tipoTamano.length === 0) {
            res.status(400).json({ error: 'El tipo de tamaño proporcionado no existe' });
            return;
        }

        const [result]: any = await pool.query(`
            UPDATE ups
            SET nombre = ?, modelo = ?, direccion_ip = ?, kva = ?, fecha_instalacion = ?, años_uso = ?, proximo_cambio = ?, modulos = ?, baterias = ?, agencias_id = ?, estado_ups_id = ?, tipo_tamano_id = ?, observacion = ?
            WHERE id = ?`, 
            [nombre, modelo, direccion_ip, kva, fecha_instalacion, años_uso, proximo_cambio, modulos, baterias, agencias_id, estado_ups_id, tipo_tamano_id, observacion, id]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'UPS actualizada exitosamente' });
        } else {
            res.status(404).json({ error: 'UPS no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la UPS' });
    }
};

// Eliminar (cambiar estado) una UPS
export const eliminarUps = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const [result]: any = await pool.query('UPDATE ups SET estado_ups_id = 2 WHERE id = ?', [id]);

        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'UPS marcada como inactiva exitosamente' });
        } else {
            res.status(404).json({ error: 'UPS no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al inactivar la UPS' });
    }
};