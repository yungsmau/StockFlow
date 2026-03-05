use crate::features::stock_simulation::{
    models::{ComputeRequest, ComputeResponse},
    service,
};
use tauri::command;

#[command]
pub fn compute_stock(req: ComputeRequest) -> Result<ComputeResponse, String> {
    service::calculate_stock(req)
}
