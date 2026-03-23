use crate::features::plan::models::{DistributePlanRequest, DistributePlanResponse};
use crate::features::plan::parser::{parse_russian_month, validate_plan_headers};
use crate::features::plan::service::distribute_plan_to_days;
use tauri::command;

#[command]
pub fn distribute_plan(request: DistributePlanRequest) -> Result<DistributePlanResponse, String> {
    distribute_plan_to_days(request).map_err(|e| e.to_string())
}

#[command]
pub fn parse_plan_date(month_str: String) -> Result<String, String> {
    parse_russian_month(&month_str)
        .map(|d| d.format("%Y-%m-%d").to_string())
        .map_err(|e| e)
}

#[command]
pub fn validate_plan_file_headers(headers: Vec<String>) -> Result<bool, String> {
    validate_plan_headers(&headers)
        .map(|_| true)
        .map_err(|e| e.to_string())
}
