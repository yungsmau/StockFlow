use crate::features::stock_simulation::{
    models::{
        ComputeRequest, ComputeResponse, DateRangeResponse, ValueFrequencyRequest,
        ValueFrequencyResult,
    },
    service,
};
use tauri::command;

#[command]
pub fn compute_stock(req: ComputeRequest) -> Result<ComputeResponse, String> {
    service::calculate_stock(req)
}

#[command]
pub fn calculate_value_frequency(
    req: ValueFrequencyRequest,
) -> Result<ValueFrequencyResult, String> {
    service::calculate_value_frequency_request(req)
}

// ✅ Новая команда для получения диапазона дат
#[command]
pub fn get_date_range_for_product(
    files: Vec<crate::features::stock_simulation::models::UploadedFile>,
    product_name: String,
) -> Result<DateRangeResponse, String> {
    service::get_date_range_for_product(&files, &product_name)
}
