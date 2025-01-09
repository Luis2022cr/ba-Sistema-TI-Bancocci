import { Request, Response } from "express";
import pool from "../database/mysql";

export const crearHistorialPrestamos = async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).user?.id; // ID del usuario autenticado

    try {
        const { expediente_id, tipo_evento, comentarios, responsable } = req.body;

        // Validar que todos los campos necesarios estén presentes
        if (!expediente_id || !tipo_evento || !responsable) {
            res.status(400).json({ error: "Todos los campos son obligatorios" });
            return;
        }

        if (!["entrada", "salida"].includes(tipo_evento)) {
            res.status(400).json({ error: "El tipo de evento debe ser 'entrada' o 'salida'" });
            return;
        }

        // Verificar que el expediente_id exista en la tabla expediente_prestamos
        const [expediente]: any = await pool.query(
            `SELECT id FROM expediente_prestamos WHERE id = ?`,
            [expediente_id]
        );

        if (expediente.length === 0) {
            res.status(404).json({ error: "Expediente no válido" });
            return;
        }

        // Insertar el historial en la tabla historial_prestamos
        await pool.query(
            `INSERT INTO historial_prestamos (expediente_id, tipo_evento, comentarios, usuario_id, responsable) 
             VALUES (?, ?, ?, ?, ?)`,
            [expediente_id, tipo_evento, comentarios, userId, responsable]
        );

        // Preparar datos para actualizar en expediente_prestamos
        const fechaCampo =
            tipo_evento === "entrada" ? "fecha_entrada" : "fecha_salida";

        // Actualizar la tabla expediente_prestamos con el nuevo comentario, fecha y responsable
        await pool.query(
            `UPDATE expediente_prestamos 
             SET comentarios = ?, responsable = ?, ${fechaCampo} = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [comentarios, responsable, expediente_id]
        );

        // Registrar el cambio en la tabla de logs
        const descripcion = `Historial creado para el expediente: ${expediente_id}`;
        const detalleCambio = `Evento: ${tipo_evento}, Responsable: ${responsable}, Comentarios: ${comentarios}`;
        await pool.query(
            `INSERT INTO logs (descripcion, cambio_realizado, usuario_id) VALUES (?, ?, ?)`,
            [descripcion, detalleCambio, userId]
        );

        res.status(201).json({
            message:
                "Historial creado exitosamente y datos actualizados en el expediente",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Error al crear el historial y actualizar el expediente",
        });
    }
};

export const obtenerExpedientePrestamosConHistorial = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        // Consulta SQL para obtener la información del expediente y su historial
        const [resultados]: any = await pool.query(`
            SELECT 
                ep.id AS "expediente_id",
                ep.numero_cliente,
                ep.nombre_cliente,
                ep.estado_id,
                ep.agencia_id,
                ep.estante,
                ep.columna,
                ep.fila,
                ep.comentarios,
                ep.fecha_entrada AS "fecha_entrada", 
                ep.fecha_salida  AS "fecha_salida", 
                ep.usuario_id,
                ep.responsable,
                e.nombre AS "estado",
                ag.nombre AS "agencia",
                u.nombre AS "usuario",
                hp.id AS "historial_id",
                hp.fecha_creacion AS "historial_fecha",
                hp.tipo_evento,
                hp.comentarios AS "historial_comentarios",
                hp.usuario_id AS "historial_usuario_id",
                uh.nombre AS "historial_usuario",
                hp.responsable AS "historial_responsable"
            FROM 
                expediente_prestamos ep
            LEFT JOIN estado_prestamos e ON ep.estado_id = e.id
            LEFT JOIN agencias ag ON ep.agencia_id = ag.id
            LEFT JOIN usuario u ON ep.usuario_id = u.id
            LEFT JOIN historial_prestamos hp ON ep.id = hp.expediente_id
            LEFT JOIN usuario uh ON hp.usuario_id = uh.id
            WHERE ep.id = ?
            ORDER BY hp.fecha_creacion DESC;

        `, [id]);

        if (resultados.length === 0) {
            res.status(404).json({ error: "No se encontró el expediente con el ID especificado" });
            return;
        }

        // Agrupar los historiales por expediente
        const expediente = {
            id: resultados[0].expediente_id,
            numero_cliente: resultados[0].numero_cliente,
            nombre_cliente: resultados[0].nombre_cliente,
            estado: resultados[0].estado,
            agencia: resultados[0].agencia,
            estante: resultados[0].estante,
            columna: resultados[0].columna,
            fila: resultados[0].fila,
            comentarios: resultados[0].comentarios,
            fecha_entrada: resultados[0].fecha_entrada,
            fecha_salida: resultados[0].fecha_salida,
            usuario: resultados[0].usuario,
            responsable: resultados[0].responsable,
            historial: resultados.map((row: any) => ({
                id: row.historial_id,
                fecha: row.historial_fecha,
                tipo_evento: row.tipo_evento,
                comentarios: row.historial_comentarios,
                usuario: row.historial_usuario,
                responsable: row.historial_responsable,
            })).filter((historial: any) => historial.id !== null), // Excluir historiales nulos
        };
        res.status(200).json(expediente);
    } catch (error) {
        console.error("Error al obtener el expediente con su historial:", error);
        res.status(500).json({ error: "Error al obtener el expediente con su historial" });
    }
};