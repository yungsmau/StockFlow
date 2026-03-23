use crate::shared::errors::detailed_error::DetailedError;
use chrono::NaiveDate;

/// Парсит русское название месяца в формате "январь 2025" → "2025-01-01"
pub fn parse_russian_month(month_str: &str) -> Result<NaiveDate, String> {
    let normalized = month_str.trim().to_lowercase();

    // Маппинг русских месяцев
    let month_map = [
        ("январь", 1),
        ("февраль", 2),
        ("март", 3),
        ("апрель", 4),
        ("май", 5),
        ("июнь", 6),
        ("июль", 7),
        ("август", 8),
        ("сентябрь", 9),
        ("октябрь", 10),
        ("ноябрь", 11),
        ("декабрь", 12),
    ];

    // Ищем месяц в строке
    let month_num = month_map
        .iter()
        .find_map(|(name, num)| {
            if normalized.contains(name) {
                Some(*num)
            } else {
                None
            }
        })
        .ok_or_else(|| format!("Не распознан месяц: {}", month_str))?;

    // Ищем год (4 цифры или 2 в конце)
    let year = normalized
        .rsplit_once(' ')
        .and_then(|(_, y)| y.parse::<i32>().ok())
        .or_else(|| {
            // Пробуем найти 2-значный год
            normalized
                .chars()
                .rev()
                .take(2)
                .collect::<String>()
                .parse::<i32>()
                .ok()
                .map(|y| if y >= 50 { 1900 + y } else { 2000 + y })
        })
        .ok_or_else(|| format!("Не распознан год в: {}", month_str))?;

    // Создаём дату (1-е число месяца)
    NaiveDate::from_ymd_opt(year, month_num, 1)
        .ok_or_else(|| format!("Невалидная дата: {}-{}", year, month_num))
        .map(|d| d)
}

/// Валидация заголовков файла плана
pub fn validate_plan_headers(headers: &[String]) -> Result<(), DetailedError> {
    let normalized: Vec<String> = headers.iter().map(|h| h.trim().to_lowercase()).collect();

    // Обязательные колонки
    let has_date = normalized.iter().any(|h| {
        h.contains("дата") || h.contains("месяц") || h.contains("date") || h.contains("month")
    });

    if !has_date {
        return Err(DetailedError {
            file: "Файл плана".to_string(),
            row: 1,
            column: "Заголовок".to_string(),
            error_type: "Ошибка валидации".to_string(),
            message: "Требуется колонка с датой/месяцем".to_string(),
        });
    }

    let has_nomenclature = normalized
        .iter()
        .any(|h| h.contains("номенклатура") || h.contains("nomenclature") || h.contains("товар"));

    if !has_nomenclature {
        return Err(DetailedError {
            file: "Файл плана".to_string(),
            row: 1,
            column: "Заголовок".to_string(),
            error_type: "Ошибка валидации".to_string(),
            message: "Требуется колонка \"Номенклатура\"".to_string(),
        });
    }

    let has_expense = normalized
        .iter()
        .any(|h| h.contains("плановый расход") || h.contains("planned") || h.contains("план"));

    if !has_expense {
        return Err(DetailedError {
            file: "Файл плана".to_string(),
            row: 1,
            column: "Заголовок".to_string(),
            error_type: "Ошибка валидации".to_string(),
            message: "Требуется колонка \"Плановый расход\"".to_string(),
        });
    }

    Ok(())
}
