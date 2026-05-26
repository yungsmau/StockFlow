use crate::shared::errors::detailed_error::DetailedError;
use chrono::NaiveDate;

pub fn parse_date_safe(
    s: &str,
    file_name: &str,
    row_index: usize,
    column_name: &str,
) -> Result<NaiveDate, String> {
    use dateparser::parse;

    let raw = s.trim();
    if raw.is_empty() {
        let err = DetailedError {
            file: file_name.to_string(),
            row: row_index + 1,
            column: column_name.to_string(),
            error_type: "Пустое значение".to_string(),
            message: "Дата не может быть пустой".to_string(),
        };
        return Err(err.to_string());
    }

    if let Ok(dt) = parse(raw) {
        return Ok(dt.date_naive());
    }

    let mut lower = raw.to_lowercase();

    if lower.ends_with(" г.") {
        lower = lower.trim_end_matches(" г.").to_string();
    } else if lower.ends_with(" г") {
        lower = lower.trim_end_matches(" г").to_string();
    }

    let rus_to_en = [
        ("января", "January"),
        ("февраля", "February"),
        ("марта", "March"),
        ("апреля", "April"),
        ("мая", "May"),
        ("июня", "June"),
        ("июля", "July"),
        ("августа", "August"),
        ("сентября", "September"),
        ("октября", "October"),
        ("ноября", "November"),
        ("декабря", "December"),
    ];

    for (ru, en) in rus_to_en.iter() {
        lower = lower.replace(ru, en);
    }

    match parse(&lower) {
        Ok(dt) => Ok(dt.date_naive()),

        Err(_) => {
            let raw = s.trim();

            // Попытка распознать Excel serial
            if let Ok(num) = raw.parse::<i64>() {
                if num > 20000 && num < 60000 {
                    let err = DetailedError {
                        file: file_name.to_string(),
                        row: row_index + 1,
                        column: column_name.to_string(),
                        error_type: "Excel serial date".to_string(),
                        message: format!(
                            "Обнаружено число '{}', похожее на Excel-дату. \
    Ожидается текстовый формат: ДД.ММ.ГГГГ или ГГГГ-ММ-ДД.",
                            raw
                        ),
                    };

                    return Err(err.to_string());
                }
            }

            let is_numeric = raw.chars().all(|c| c.is_ascii_digit());

            let err = DetailedError {
                file: file_name.to_string(),
                row: row_index + 1,
                column: column_name.to_string(),
                error_type: if is_numeric {
                    "Неверный формат даты".to_string()
                } else {
                    "Неизвестный формат даты".to_string()
                },
                message: format!(
                    "Не удалось распознать дату: '{}'. \
    Поддерживаемые форматы: ДД.ММ.ГГГГ, ГГГГ-ММ-ДД.",
                    raw
                ),
            };

            Err(err.to_string())
        }
    }
}
