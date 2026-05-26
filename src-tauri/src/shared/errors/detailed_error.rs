use serde::Serialize;

#[derive(Serialize)]
pub struct DetailedError {
    pub file: String,
    pub row: usize,
    pub column: String,
    pub error_type: String,
    pub message: String,
}

impl DetailedError {
    pub fn to_string(&self) -> String {
        format!(
            "file={},row={},column={},type={},msg={}",
            self.file, self.row, self.column, self.error_type, self.message
        )
    }
}
