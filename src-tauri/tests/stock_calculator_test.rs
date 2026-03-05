use stock_simulator_lib::features::stock_simulation::{
    models::{ComputeRequest, RowData, UploadedFile},
    service::calculate_stock,
};

fn create_test_file(data: Vec<RowData>) -> UploadedFile {
    UploadedFile {
        name: "test.xlsx".to_string(),
        data,
    }
}

#[test]
fn test_empty_product_returns_error() {
    let file = create_test_file(vec![RowData {
        nomenclature: "Другой товар".to_string(),
        date: "2025-01-01".to_string(),
        income: 0.0,
        expense: 20.0,
        stock: 80.0,
    }]);

    let req = ComputeRequest {
        product: "Товар А".to_string(),
        uploaded_files: vec![file],
        initial_stock: 100,
        threshold: 50,
        delivery_days: 3,
        unit_cost: Some(10.0),
    };

    let result = calculate_stock(req);
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Не найдено ни одной записи"));
}

#[test]
fn test_validation_errors() {
    let file = create_test_file(vec![RowData {
        nomenclature: "Товар А".to_string(),
        date: "2025-01-01".to_string(),
        income: 0.0,
        expense: 20.0,
        stock: 80.0,
    }]);

    // Тест слишком большой поставки
    let req = ComputeRequest {
        product: "Товар А".to_string(),
        uploaded_files: vec![file.clone()],
        initial_stock: 15_000_000,
        threshold: 50,
        delivery_days: 3,
        unit_cost: Some(10.0),
    };

    let result = calculate_stock(req);
    assert!(result.is_err());
    assert!(result
        .unwrap_err()
        .contains("Значение поставки не должно превышать"));

    // Тест отрицательной цены
    let req2 = ComputeRequest {
        product: "Товар А".to_string(),
        uploaded_files: vec![file],
        initial_stock: 100,
        threshold: 50,
        delivery_days: 3,
        unit_cost: Some(-5.0),
    };

    let result2 = calculate_stock(req2);
    assert!(result2.is_err());
    assert!(result2
        .unwrap_err()
        .contains("Цена должна быть в диапазоне"));
}

#[test]
fn test_recommended_threshold_calculation() {
    let file = create_test_file(vec![
        RowData {
            nomenclature: "Товар А".to_string(),
            date: "2025-01-01".to_string(),
            income: 0.0,
            expense: 30.0,
            stock: 70.0,
        },
        RowData {
            nomenclature: "Товар А".to_string(),
            date: "2025-01-02".to_string(),
            income: 0.0,
            expense: 40.0,
            stock: 30.0,
        },
        RowData {
            nomenclature: "Товар А".to_string(),
            date: "2025-01-03".to_string(),
            income: 0.0,
            expense: 25.0,
            stock: 5.0,
        },
    ]);

    let req = ComputeRequest {
        product: "Товар А".to_string(),
        uploaded_files: vec![file],
        initial_stock: 100,
        threshold: 50,
        delivery_days: 2,
        unit_cost: Some(10.0),
    };

    let result = calculate_stock(req).unwrap();
    assert_eq!(result.recommended_threshold, 70);
}

#[test]
fn test_actual_metrics_calculation() {
    let file = create_test_file(vec![
        RowData {
            nomenclature: "Товар А".to_string(),
            date: "2025-01-01".to_string(),
            income: 0.0,
            expense: 20.0,
            stock: 80.0,
        },
        RowData {
            nomenclature: "Товар А".to_string(),
            date: "2025-01-02".to_string(),
            income: 0.0,
            expense: 15.0,
            stock: 65.0,
        },
    ]);

    let req = ComputeRequest {
        product: "Товар А".to_string(),
        uploaded_files: vec![file],
        initial_stock: 100,
        threshold: 50,
        delivery_days: 3,
        unit_cost: Some(10.0),
    };

    let result = calculate_stock(req).unwrap();
    assert!((result.actual_avg_stock - 72.5).abs() < 0.1);
    assert!((result.actual_total_price - 725.0).abs() < 1.0);
}
