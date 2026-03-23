// src-tauri/src/features/plan/commands.rs
use crate::features::plan::models::{DistributePlanRequest, DistributePlanResponse, PlanItem};
use crate::features::plan::parser::{parse_russian_month, validate_plan_headers};
use crate::features::plan::service::distribute_plan_to_days;
// ✅ УДАЛЕНО: use serde::{Deserialize, Serialize}; — не используется в этом файле
use tauri::command;

/// Команда: распарсить файл плана (Excel/CSV) — опционально, можно делать на TS
#[command]
pub async fn parse_plan_file(
    // ✅ Добавлено _ перед неиспользуемыми параметрами
    _file_path: String,
    _file_name: String,
) -> Result<Vec<PlanItem>, String> {
    // Опционально: если нужно парсить на Rust
    // Для начала лучше парсить на TypeScript (exceljs/papaparse)
    // и передавать уже распарсенные PlanItem в Rust для распределения
    Err(
        "Парсинг файлов выполняется на TypeScript. Используйте parsePlanExcel/parsePlanCSV."
            .to_string(),
    )
}

/// Команда: распределить месячный план по дням
#[command]
pub fn distribute_plan(request: DistributePlanRequest) -> Result<DistributePlanResponse, String> {
    distribute_plan_to_days(request).map_err(|e| e.to_string())
}

/// Команда: распарсить русскую дату "январь 2025" → "2025-01-01"
#[command]
pub fn parse_plan_date(month_str: String) -> Result<String, String> {
    parse_russian_month(&month_str)
        .map(|d| d.format("%Y-%m-%d").to_string())
        .map_err(|e| e)
}

/// Команда: валидировать заголовки файла плана
#[command]
pub fn validate_plan_file_headers(headers: Vec<String>) -> Result<bool, String> {
    validate_plan_headers(&headers)
        .map(|_| true)
        .map_err(|e| e.to_string())
}
