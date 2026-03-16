mod features;
mod shared;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            features::stock_simulation::commands::compute_stock,
            features::stock_simulation::commands::calculate_value_frequency,
            features::stock_simulation::commands::get_date_range_for_product,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
