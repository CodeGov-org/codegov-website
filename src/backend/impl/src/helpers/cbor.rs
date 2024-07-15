use serde::Serialize;
use serde_cbor::Serializer;

pub fn cbor_encode(value: &impl Serialize) -> Vec<u8> {
    let mut serializer = Serializer::new(Vec::new());
    serializer
        .self_describe()
        .expect("Failed to self describe CBOR");
    value
        .serialize(&mut serializer)
        .expect("Failed to serialize value");
    serializer.into_inner()
}
