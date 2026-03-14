use crate::features::stock_simulation::date_parser;
use crate::features::stock_simulation::models::{
    ComputeRequest, ComputeResponse, DateRangeResponse, UploadedFile, ValueFrequencyBin,
    ValueFrequencyRequest, ValueFrequencyResult,
};
use crate::shared::errors::detailed_error::DetailedError;
use chrono::{Duration, NaiveDate};
use std::collections::{BTreeMap, HashMap};

fn calculate_actual_metrics(
    uploaded_files: &[UploadedFile],
    product: &str,
    unit_cost: f64,
) -> (f64, f64) {
    if !unit_cost.is_finite() || unit_cost < 0.0 {
        return (0.0, 0.0);
    }

    let mut total_stock = 0.0;
    let mut count = 0;

    for file in uploaded_files {
        for row in &file.data {
            if row.nomenclature == product && row.stock > 0.0 {
                total_stock += row.stock;
                count += 1;
            }
        }
    }

    if count == 0 {
        return (0.0, 0.0);
    }

    let avg_stock = total_stock / count as f64;
    let total_price = avg_stock * unit_cost;

    (avg_stock, total_price)
}

fn calculate_actual_deliveries(uploaded_files: &[UploadedFile], product: &str) -> i32 {
    uploaded_files
        .iter()
        .flat_map(|f| &f.data)
        .filter(|r| r.nomenclature == product && r.income > 0.0)
        .count() as i32
}

fn calculate_avg_delivery_interval_actual(uploaded_files: &[UploadedFile], product: &str) -> f64 {
    let mut delivery_dates = Vec::new();

    for file in uploaded_files {
        for (row_index, r) in file.data.iter().enumerate() {
            if r.nomenclature == product && r.income > 0.0 {
                if let Ok(date) =
                    date_parser::parse_date_safe(&r.date, &file.name, row_index, "Дата")
                {
                    delivery_dates.push(date);
                }
            }
        }
    }

    if delivery_dates.len() < 2 {
        return 0.0;
    }

    delivery_dates.sort();
    let mut intervals: Vec<i64> = Vec::new();

    for i in 1..delivery_dates.len() {
        let diff = delivery_dates[i]
            .signed_duration_since(delivery_dates[i - 1])
            .num_days();
        if diff > 0 {
            intervals.push(diff);
        }
    }

    if intervals.is_empty() {
        0.0
    } else {
        let total: i64 = intervals.iter().sum();
        total as f64 / intervals.len() as f64
    }
}

fn calculate_avg_delivery_interval_model(_dates: &[String], incoming: &[i32]) -> f64 {
    let mut delivery_indices = Vec::new();

    for (i, &amount) in incoming.iter().enumerate() {
        if amount > 0 {
            delivery_indices.push(i);
        }
    }

    if delivery_indices.len() < 2 {
        return 0.0;
    }

    let mut intervals: Vec<i64> = Vec::new();

    for i in 1..delivery_indices.len() {
        let idx_prev = delivery_indices[i - 1];
        let idx_curr = delivery_indices[i];
        let days_diff = (idx_curr - idx_prev) as i64; // предполагается, что даты идут подряд
        if days_diff > 0 {
            intervals.push(days_diff);
        }
    }

    if intervals.is_empty() {
        0.0
    } else {
        let total: i64 = intervals.iter().sum();
        total as f64 / intervals.len() as f64
    }
}

fn calculate_average_expense(
    uploaded_files: &[UploadedFile],
    product: &str,
    delivery_days: i32,
) -> f64 {
    if delivery_days <= 0 {
        return 0.0;
    }

    let window_size = delivery_days as usize;
    let mut date_to_expense: BTreeMap<NaiveDate, f64> = BTreeMap::new();

    // Собираем расходы по датам
    for file in uploaded_files {
        for (row_index, r) in file.data.iter().enumerate() {
            if r.nomenclature == product {
                match date_parser::parse_date_safe(&r.date, &file.name, row_index, "Дата") {
                    Ok(date) => {
                        *date_to_expense.entry(date).or_insert(0.0) += r.expense;
                    }
                    Err(_) => continue,
                }
            }
        }
    }

    if date_to_expense.is_empty() {
        return 0.0;
    }

    let expenses: Vec<f64> = date_to_expense.values().copied().collect();

    if expenses.len() < window_size {
        // Если данных меньше окна — среднее за весь период
        let total: f64 = expenses.iter().sum();
        return total / expenses.len() as f64;
    }

    // Считаем сумму каждого окна
    let mut window_sums = Vec::new();
    for i in 0..=(expenses.len() - window_size) {
        let window_sum: f64 = expenses[i..i + window_size].iter().sum();
        window_sums.push(window_sum);
    }

    // Возвращаем среднее по всем окнам
    let total_sum: f64 = window_sums.iter().sum();
    total_sum / window_sums.len() as f64
}

fn calculate_max_expense(
    uploaded_files: &[UploadedFile],
    product: &str,
    delivery_days: i32,
) -> i32 {
    if delivery_days <= 0 {
        return 100;
    }

    let window_size = delivery_days as usize;
    let mut date_to_expense: BTreeMap<NaiveDate, f64> = BTreeMap::new();

    for file in uploaded_files {
        for (row_index, r) in file.data.iter().enumerate() {
            if r.nomenclature == product {
                match date_parser::parse_date_safe(&r.date, &file.name, row_index, "Дата") {
                    Ok(date) => {
                        *date_to_expense.entry(date).or_insert(0.0) += r.expense;
                    }
                    Err(_) => continue,
                }
            }
        }
    }

    if date_to_expense.is_empty() {
        return 100;
    }

    let expenses: Vec<f64> = date_to_expense.values().copied().collect();

    if expenses.len() < window_size {
        return expenses.iter().sum::<f64>() as i32;
    }

    let mut max_window_sum = 0.0;
    for i in 0..=(expenses.len() - window_size) {
        let window_sum: f64 = expenses[i..i + window_size].iter().sum();
        if window_sum > max_window_sum {
            max_window_sum = window_sum;
        }
    }

    let recommended = max_window_sum.ceil() as i32;
    recommended.max(1)
}

pub fn calculate_stock(req: ComputeRequest) -> Result<ComputeResponse, String> {
    const MAX_INITIAL_STOCK: i32 = 5_000_000;
    const MAX_THRESHOLD: i32 = 5_000_000;
    const MAX_DELIVERY_DAYS: i32 = 365;
    const MAX_UNIT_COST: f64 = 1_000_000.0;
    const MIN_UNIT_COST: f64 = 0.0;

    if req.initial_stock <= 0 {
        let err = DetailedError {
            file: "Параметры модели".to_string(),
            row: 0,
            column: "Поставка".to_string(),
            error_type: "Ошибка валидации".to_string(),
            message: "Поставка должна быть больше 0".to_string(),
        };
        return Err(err.to_string());
    }

    if req.delivery_days <= 0 {
        let err = DetailedError {
            file: "Параметры модели".to_string(),
            row: 0,
            column: "Дней доставки".to_string(),
            error_type: "Ошибка валидации".to_string(),
            message: "Дни доставки должны быть больше 0".to_string(),
        };
        return Err(err.to_string());
    }

    if req.initial_stock > MAX_INITIAL_STOCK {
        let err = DetailedError {
            file: "Параметры модели".to_string(),
            row: 0,
            column: "Поставка".to_string(),
            error_type: "Ошибка валидации".to_string(),
            message: format!(
                "Значение поставки не должно превышать {}",
                MAX_INITIAL_STOCK
            ),
        };
        return Err(err.to_string());
    }

    if req.threshold > MAX_THRESHOLD {
        let err = DetailedError {
            file: "Параметры модели".to_string(),
            row: 0,
            column: "Порог".to_string(),
            error_type: "Ошибка валидации".to_string(),
            message: format!("Значение порога не должно превышать {}", MAX_THRESHOLD),
        };
        return Err(err.to_string());
    }

    if req.delivery_days > MAX_DELIVERY_DAYS {
        let err = DetailedError {
            file: "Параметры модели".to_string(),
            row: 0,
            column: "Дней доставки".to_string(),
            error_type: "Ошибка валидации".to_string(),
            message: format!(
                "Количество дней доставки не должно превышать {}",
                MAX_DELIVERY_DAYS
            ),
        };
        return Err(err.to_string());
    }

    let unit_cost = req.unit_cost.unwrap_or(0.0);
    if !unit_cost.is_finite() || unit_cost < MIN_UNIT_COST || unit_cost > MAX_UNIT_COST {
        let err = DetailedError {
            file: "Параметры модели".to_string(),
            row: 0,
            column: "Цена".to_string(),
            error_type: "Ошибка валидации".to_string(),
            message: format!(
                "Цена должна быть в диапазоне от {} до {}",
                MIN_UNIT_COST, MAX_UNIT_COST
            ),
        };
        return Err(err.to_string());
    }

    let mut has_product = false;
    for file in &req.uploaded_files {
        if file.data.iter().any(|r| r.nomenclature == req.product) {
            has_product = true;
            break;
        }
    }

    if !has_product {
        let err = DetailedError {
            file: "Все файлы".to_string(),
            row: 0,
            column: "Номенклатура".to_string(),
            error_type: "Ошибка валидации".to_string(),
            message: "Не найдено ни одной записи для выбранного продукта".to_string(),
        };
        return Err(err.to_string());
    }

    let mut date_to_spent: BTreeMap<NaiveDate, i32> = BTreeMap::new();
    for file in &req.uploaded_files {
        for (row_index, r) in file.data.iter().enumerate() {
            if r.nomenclature == req.product {
                let date = date_parser::parse_date_safe(&r.date, &file.name, row_index, "Дата")?;
                *date_to_spent.entry(date).or_insert(0) += r.expense as i32;
            }
        }
    }

    let first_real_date = match date_to_spent.keys().next() {
        Some(d) => *d,
        None => {
            return Err("Нет корректных дат для расчета".into());
        }
    };

    let start_date = first_real_date - Duration::days(1);

    let mut deliveries: BTreeMap<NaiveDate, i32> = BTreeMap::new();
    deliveries.insert(start_date, req.initial_stock);
    date_to_spent.insert(start_date, 0);

    let mut result_dates = vec![];
    let mut starting_stock = vec![];
    let mut spent = vec![];
    let mut incoming = vec![];

    let mut current_stock = 0;
    let mut all_dates: Vec<NaiveDate> = date_to_spent.keys().cloned().collect();
    all_dates.sort();

    let mut i = 0;
    while i < all_dates.len() {
        let today = all_dates[i];

        let incoming_amount = deliveries.remove(&today).unwrap_or(0);
        current_stock += incoming_amount;

        let spent_today = date_to_spent.get(&today).copied().unwrap_or(0);

        current_stock = (current_stock - spent_today).max(0);

        result_dates.push(today.format("%Y-%m-%d").to_string());
        // Примечание: starting_stock теперь содержит остаток ПОСЛЕ применения расхода за день
        // (ранее содержал остаток ДО расхода)
        starting_stock.push(current_stock);
        spent.push(spent_today);
        incoming.push(incoming_amount);

        let has_future_delivery = deliveries.keys().any(|&d| d > today);
        if current_stock <= req.threshold && !has_future_delivery {
            let arrival_date = today + Duration::days(req.delivery_days as i64);
            deliveries.insert(arrival_date, req.initial_stock);

            if !date_to_spent.contains_key(&arrival_date) {
                date_to_spent.insert(arrival_date, 0);
                match all_dates.binary_search(&arrival_date) {
                    Ok(_) => {}
                    Err(pos) => all_dates.insert(pos, arrival_date),
                }
            }
        }

        i += 1;
    }

    let avg_stock = if starting_stock.is_empty() {
        0.0
    } else {
        let total_stock_i64: i64 = starting_stock.iter().map(|&x| x as i64).sum();
        total_stock_i64 as f64 / starting_stock.len() as f64
    };

    let total_price = avg_stock * unit_cost;

    let (actual_avg_stock, actual_total_price) =
        calculate_actual_metrics(&req.uploaded_files, &req.product, unit_cost);

    let actual_deliveries = calculate_actual_deliveries(&req.uploaded_files, &req.product);
    let deliveries_count = incoming.iter().filter(|&&x| x > 0).count() as i32;

    let efficiency = if actual_total_price > 0.0 {
        ((actual_total_price - total_price) / actual_total_price) * 100.0
    } else {
        0.0
    };

    let efficiency_abs = actual_total_price - total_price;

    let avg_expense =
        calculate_average_expense(&req.uploaded_files, &req.product, req.delivery_days);

    let recommended_threshold =
        calculate_max_expense(&req.uploaded_files, &req.product, req.delivery_days);

    let avg_delivery_interval_actual =
        calculate_avg_delivery_interval_actual(&req.uploaded_files, &req.product);

    let avg_delivery_interval_model =
        calculate_avg_delivery_interval_model(&result_dates, &incoming);

    Ok(ComputeResponse {
        dates: result_dates,
        starting_stock,
        incoming,
        spent,
        threshold: req.threshold,
        avg_stock,
        actual_avg_stock,
        deliveries: deliveries_count,
        actual_deliveries,
        unit_cost,
        total_price,
        actual_total_price,
        efficiency,
        efficiency_abs,
        avg_expense,
        recommended_threshold,
        avg_delivery_interval_actual,
        avg_delivery_interval_model,
    })
}

pub fn calculate_value_frequency(
    uploaded_files: &[UploadedFile],
    product: &str,
    value_type: &str,
    window_size: usize,
) -> Result<ValueFrequencyResult, String> {
    if window_size == 0 {
        return Err("Window size must be positive".into());
    }

    if value_type != "stock" && value_type != "expense" {
        return Err("value_type must be 'stock' or 'expense'".into());
    }

    // 1. Собираем значения по датам (как в calculate_average_expense)
    let mut date_to_values: BTreeMap<NaiveDate, f64> = BTreeMap::new();

    for file in uploaded_files {
        for (row_index, r) in file.data.iter().enumerate() {
            if r.nomenclature == product {
                match date_parser::parse_date_safe(&r.date, &file.name, row_index, "Дата") {
                    Ok(date) => {
                        let value = if value_type == "stock" {
                            r.stock
                        } else {
                            r.expense
                        };
                        if value.is_finite() && value >= 0.0 {
                            *date_to_values.entry(date).or_insert(0.0) += value;
                        }
                    }
                    Err(_) => continue,
                }
            }
        }
    }

    if date_to_values.is_empty() {
        return Err(format!(
            "No valid {} values found for product '{}'",
            value_type, product
        ));
    }

    // 2. Превращаем в вектор значений (отсортирован по дате)
    let values: Vec<f64> = date_to_values.values().copied().collect();

    if values.len() < window_size {
        // Если данных меньше окна — считаем среднее по всем доступным точкам
        let avg_value = values.iter().sum::<f64>() / values.len() as f64;
        return Ok(ValueFrequencyResult {
            bins: vec![],
            total_windows: 0,
            window_size,
            value_type: value_type.to_string(),
            min_value: values.iter().cloned().fold(f64::INFINITY, f64::min),
            max_value: values.iter().cloned().fold(f64::NEG_INFINITY, f64::max),
            avg_value,
        });
    }

    // 3. Скользящее окно: считаем суммы ВСЕХ окон (как в calculate_average_expense)
    let mut window_sums: Vec<f64> = Vec::new(); // ✅ Храним все суммы для расчёта среднего
    let mut value_counts: HashMap<i64, u32> = HashMap::new();

    for i in 0..=(values.len() - window_size) {
        let window_sum: f64 = values[i..i + window_size].iter().sum();

        // ✅ Сохраняем сумму для расчёта среднего (как в calculate_average_expense)
        window_sums.push(window_sum);

        // ✅ Округляем до 2 знаков для группировки частот
        let key = (window_sum * 100.0).round() as i64;
        *value_counts.entry(key).or_insert(0) += 1;
    }

    if window_sums.is_empty() {
        return Err("No windows could be calculated".into());
    }

    // 4. ✅ Считаем среднее ПО ВСЕМ окнам (как в calculate_average_expense)
    let total_sum: f64 = window_sums.iter().sum();
    let avg_value = total_sum / window_sums.len() as f64;

    // 5. Формируем результат для графика
    let total_windows = value_counts.values().sum::<u32>();

    let mut sorted_entries: Vec<(f64, u32)> = value_counts
        .into_iter()
        .map(|(key, count)| ((key as f64) / 100.0, count))
        .collect();
    sorted_entries.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(std::cmp::Ordering::Equal));

    let min_value = sorted_entries.first().map(|(v, _)| *v).unwrap_or(0.0);
    let max_value = sorted_entries.last().map(|(v, _)| *v).unwrap_or(0.0);

    let bins: Vec<ValueFrequencyBin> = sorted_entries
        .into_iter()
        .map(|(value, count)| {
            let percentage = (count as f64 / total_windows as f64) * 100.0;
            ValueFrequencyBin {
                value,
                count,
                percentage,
            }
        })
        .collect();

    Ok(ValueFrequencyResult {
        bins,
        total_windows,
        window_size,
        value_type: value_type.to_string(),
        min_value,
        max_value,
        avg_value, // ✅ Теперь считается как среднее всех окон (как в calculate_average_expense)
    })
}

// === Обертка под паттерн Request/Response (для Tauri command) ===
pub fn calculate_value_frequency_request(
    req: ValueFrequencyRequest,
) -> Result<ValueFrequencyResult, String> {
    calculate_value_frequency(
        &req.uploaded_files,
        &req.product,
        &req.value_type,
        req.window_size,
    )
}

// фильтр
// === Получение диапазона дат для продукта ===

/// Возвращает минимальную и максимальную дату для указанного продукта
/// Использует тот же парсер дат, что и остальные функции
pub fn get_date_range_for_product(
    uploaded_files: &[UploadedFile],
    product_name: &str,
) -> Result<DateRangeResponse, String> {
    let mut min_date: Option<NaiveDate> = None;
    let mut max_date: Option<NaiveDate> = None;

    // Нормализуем имя продукта для надёжного сравнения
    let normalized_product = product_name.trim().to_lowercase();

    for file in uploaded_files {
        for (row_index, row) in file.data.iter().enumerate() {
            // Сравниваем с нормализацией (пробелы, регистр)
            let row_product = row.nomenclature.trim().to_lowercase();
            if row_product != normalized_product {
                continue;
            }

            // ✅ Используем твой надёжный парсер дат
            if let Ok(date) = date_parser::parse_date_safe(&row.date, &file.name, row_index, "Дата")
            {
                // Обновляем мин/макс
                match (min_date, max_date) {
                    (None, None) => {
                        min_date = Some(date);
                        max_date = Some(date);
                    }
                    (Some(min), Some(max)) => {
                        if date < min {
                            min_date = Some(date);
                        }
                        if date > max {
                            max_date = Some(date);
                        }
                    }
                    _ => {}
                }
            }
            // Если дата не распарсилась — просто пропускаем строку
        }
    }

    Ok(DateRangeResponse {
        min: min_date.map(|d| d.format("%Y-%m-%d").to_string()),
        max: max_date.map(|d| d.format("%Y-%m-%d").to_string()),
    })
}
