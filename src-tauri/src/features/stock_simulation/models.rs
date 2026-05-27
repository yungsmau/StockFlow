use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct RowData {
    pub nomenclature: String,
    pub date: String,
    pub income: f64,
    pub expense: f64,
    pub stock: f64,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct UploadedFile {
    pub name: String,
    pub data: Vec<RowData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingOrder {
    pub arrival_date: String,
    pub quantity: i32,
}

#[derive(Deserialize, Clone, Debug)]
pub struct ComputeRequest {
    pub product: String,
    pub uploaded_files: Vec<UploadedFile>,
    pub initial_stock: i32,
    pub threshold: i32,
    pub delivery_days: i32,
    pub unit_cost: Option<f64>,
    #[serde(default)]
    pub enable_overlapping: bool,
    #[serde(default)]
    pub overlap_count: u32,
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
    #[serde(default)]
    pub order_created: Vec<i32>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ValueFrequencyBin {
    pub value: f64,
    pub count: u32,
    pub percentage: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ValueFrequencyResult {
    pub bins: Vec<ValueFrequencyBin>,
    pub total_windows: u32,
    pub window_size: usize,
    pub value_type: String,
    pub min_value: f64,
    pub max_value: f64,
    pub avg_value: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ValueFrequencyRequest {
    pub uploaded_files: Vec<UploadedFile>,
    pub product: String,
    pub value_type: String,
    pub window_size: usize,
}

// фильтр
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DateRangeResponse {
    pub min: Option<String>,
    pub max: Option<String>,
}
