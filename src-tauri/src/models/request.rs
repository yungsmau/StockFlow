// src-tauri/src/models/request.rs
use serde::Deserialize;

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
