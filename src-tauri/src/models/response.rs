use serde::Serialize;

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
