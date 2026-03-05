use serde::{Deserialize, Serialize};

#[derive(Deserialize, Clone)]
pub struct RowData {
    pub nomenclature: String,
    pub date: String,
    pub income: f64,
    pub expense: f64,
    pub stock: f64,
}

#[derive(Deserialize, Clone)]
pub struct UploadedFile {
    pub name: String,
    pub data: Vec<RowData>,
}

#[derive(Deserialize)]
pub struct ComputeRequest {
    pub product: String,
    pub uploaded_files: Vec<UploadedFile>,
    pub initial_stock: i32,
    pub threshold: i32,
    pub delivery_days: i32,
    pub unit_cost: Option<f64>,
}

#[derive(Serialize, Debug)]
pub struct ComputeResponse {
    pub dates: Vec<String>,
    pub starting_stock: Vec<i32>,
    pub incoming: Vec<i32>,
    pub spent: Vec<i32>,
    pub threshold: i32,
    pub avg_stock: f64,
    pub deliveries: i32,
    pub unit_cost: f64,
    pub total_price: f64,
    pub actual_avg_stock: f64,
    pub actual_total_price: f64,
    pub actual_deliveries: i32,
    pub efficiency: f64,
    pub efficiency_abs: f64,
    pub avg_expense: f64,
    pub recommended_threshold: i32,
    pub avg_delivery_interval_actual: f64,
    pub avg_delivery_interval_model: f64,
}
