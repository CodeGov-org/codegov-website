use ic_cdk::*;

#[query]
fn say_hello() -> String {
    "Hello, world!".to_string()
}
