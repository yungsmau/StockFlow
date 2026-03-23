use serde::{Deserialize, Serialize};

/// Элемент плана (месячные данные)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlanItem {
    pub nomenclature: String,
    pub month: String,      // "январь 2025"
    pub month_date: String, // "2025-01-01" (ISO формат)
    pub planned_expense: f64,
}

/// Элемент дневного плана (результат распределения)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyPlanItem {
    pub nomenclature: String,
    pub date: String, // "2025-01-01"
    pub planned_expense: f64,
}

/// Запрос на распределение плана
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DistributePlanRequest {
    pub items: Vec<PlanItem>,
    pub working_days_only: Option<bool>, // учитывать только рабочие дни
}

/// Ответ с дневными данными
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DistributePlanResponse {
    pub items: Vec<DailyPlanItem>,
}
