import { z } from "zod";

// Project validation
export const projectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "O nome do projeto é obrigatório")
        .max(100, "O nome deve ter no máximo 100 caracteres"),
    key: z
        .string()
        .trim()
        .min(2, "A chave deve ter pelo menos 2 caracteres")
        .max(10, "A chave deve ter no máximo 10 caracteres")
        .regex(/^[A-Z0-9]+$/, "A chave deve conter apenas letras maiúsculas e números"),
    description: z
        .string()
        .max(1000, "A descrição deve ter no máximo 1000 caracteres")
        .optional()
        .or(z.literal("")),
    due_date: z.string().optional().or(z.literal("")),
    icon_name: z.string().optional(),
});

// Task validation
export const taskSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "O título é obrigatório")
        .max(200, "O título deve ter no máximo 200 caracteres"),
    description: z
        .string()
        .max(5000, "A descrição deve ter no máximo 5000 caracteres")
        .optional()
        .or(z.literal("")),
    estimated_hours: z
        .number()
        .positive("As horas devem ser positivas")
        .max(1000, "As horas devem ser no máximo 1000")
        .optional()
        .nullable(),
    due_date: z.string().optional().or(z.literal("")),
    priority: z.enum(["low", "medium", "high", "critical"]),
    status: z.enum(["todo", "in_progress", "done", "blocked"]),
});

// User Story validation
export const userStorySchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, "O título é obrigatório")
        .max(200, "O título deve ter no máximo 200 caracteres"),
    description: z
        .string()
        .max(5000, "A descrição deve ter no máximo 5000 caracteres")
        .optional()
        .or(z.literal("")),
    acceptance_criteria: z
        .string()
        .max(5000, "Os critérios devem ter no máximo 5000 caracteres")
        .optional()
        .or(z.literal("")),
    story_points: z
        .number()
        .int("Os pontos devem ser um número inteiro")
        .positive("Os pontos devem ser positivos")
        .max(100, "Os pontos devem ser no máximo 100")
        .optional()
        .nullable(),
    due_date: z.string().optional().or(z.literal("")),
    priority: z.enum(["low", "medium", "high", "critical"]),
});

// Comment validation
export const commentSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, "O comentário não pode estar vazio")
        .max(2000, "O comentário deve ter no máximo 2000 caracteres"),
});

// Label validation
export const labelSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "O nome é obrigatório")
        .max(50, "O nome deve ter no máximo 50 caracteres"),
    color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (formato: #RRGGBB)"),
});

// Sprint validation
export const sprintSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "O nome é obrigatório")
        .max(100, "O nome deve ter no máximo 100 caracteres"),
    goal: z
        .string()
        .max(500, "O objetivo deve ter no máximo 500 caracteres")
        .optional()
        .or(z.literal("")),
    start_date: z.string().min(1, "A data de início é obrigatória"),
    end_date: z.string().min(1, "A data de término é obrigatória"),
    status: z.enum(["planning", "active", "completed"]).optional(),
});

// Organization validation
export const organizationSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "O nome da organização é obrigatório")
        .max(100, "O nome deve ter no máximo 100 caracteres"),
});

// Profile validation
export const profileSchema = z.object({
    full_name: z
        .string()
        .trim()
        .max(100, "O nome deve ter no máximo 100 caracteres")
        .optional()
        .or(z.literal("")),
    nickname: z
        .string()
        .trim()
        .max(50, "O apelido deve ter no máximo 50 caracteres")
        .optional()
        .or(z.literal("")),
});
