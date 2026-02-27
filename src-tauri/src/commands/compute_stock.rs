use crate::models::request::ComputeRequest;
use crate::services::stock_calculator;
use tauri::command;

#[command]
pub fn compute_stock(
    req: ComputeRequest,
) -> Result<crate::models::response::ComputeResponse, String> {
    stock_calculator::calculate_stock(req)
}
