import { Request, Response } from 'express';
import pool from '../database/mysql';


// Obtener todos los estados
export const getEstadoPrestamos = async (req: Request, res: Response): Promise<void> => {
    try {
        const [estados] = await pool.query('SELECT * FROM estado_prestamos');
        res.status(200).json(estados);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los estados' });
    }
};

