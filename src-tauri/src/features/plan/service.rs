use crate::features::plan::models::{DailyPlanItem, DistributePlanRequest, DistributePlanResponse};
use crate::shared::errors::detailed_error::DetailedError;
use chrono::{Datelike, NaiveDate};

/// Распределяет месячный план по дням (линейно)
pub fn distribute_plan_to_days(
    req: DistributePlanRequest,
) -> Result<DistributePlanResponse, DetailedError> {
    let working_only = req.working_days_only.unwrap_or(false);
    let mut result = Vec::new();

    for item in req.items {
        // Парсим дату месяца
        let month_start =
            NaiveDate::parse_from_str(&item.month_date, "%Y-%m-%d").map_err(|e| DetailedError {
                file: "Файл плана".to_string(),
                row: 0,
                column: "Дата".to_string(),
                error_type: "Ошибка парсинга".to_string(),
                message: format!("Не удалось распарсить дату {}: {}", item.month_date, e),
            })?;

        let year = month_start.year();
        let month = month_start.month();

        // Количество дней в месяце
        let days_in_month = get_days_in_month(year, month);

        // Если только рабочие дни — считаем их
        let target_days = if working_only {
            count_working_days(year, month) as f64
        } else {
            days_in_month as f64
        };

        if target_days <= 0.0 {
            return Err(DetailedError {
                file: "Файл плана".to_string(),
                row: 0,
                column: "Плановый расход".to_string(),
                error_type: "Ошибка расчёта".to_string(),
                message: "Невозможно распределить план: 0 целевых дней".to_string(),
            });
        }

        // Дневная норма
        let daily_amount = item.planned_expense / target_days;

        // Генерируем записи для каждого дня
        for day in 1..=days_in_month {
            if let Some(date) = month_start.with_day(day) {
                // Пропускаем выходные, если нужно
                if working_only && is_weekend(date) {
                    continue;
                }

                result.push(DailyPlanItem {
                    nomenclature: item.nomenclature.clone(),
                    date: date.format("%Y-%m-%d").to_string(),
                    planned_expense: daily_amount,
                });
            }
        }
    }

    // Сортируем по дате
    result.sort_by(|a, b| a.date.cmp(&b.date));

    Ok(DistributePlanResponse { items: result })
}

/// Возвращает количество дней в месяце (учитывает високосные годы)
fn get_days_in_month(year: i32, month: u32) -> u32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            if (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0) {
                29
            } else {
                28
            }
        }
        _ => 30,
    }
}

/// Проверяет, является ли дата выходным (сб/вс)
fn is_weekend(date: NaiveDate) -> bool {
    let weekday = date.weekday().num_days_from_sunday();
    weekday == 0 || weekday == 6 // 0 = воскресенье, 6 = суббота
}

/// Считает количество рабочих дней в месяце
fn count_working_days(year: i32, month: u32) -> u32 {
    let days_in_month = get_days_in_month(year, month);
    let mut count = 0;

    for day in 1..=days_in_month {
        if let Some(date) = NaiveDate::from_ymd_opt(year, month, day) {
            if !is_weekend(date) {
                count += 1;
            }
        }
    }
    count
}
