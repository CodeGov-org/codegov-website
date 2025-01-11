use fastrand::Rng;
use std::cell::RefCell;

thread_local! {
  static RNG: RefCell<Rng> = create_rng();
}

fn create_rng() -> RefCell<Rng> {
    let seed = get_seed();
    let rng = Rng::with_seed(seed);

    RefCell::new(rng)
}

fn get_seed() -> u64 {
    #[cfg(target_family = "wasm")]
    {
        ic_cdk::api::time()
    }

    // fallback seed for non-wasm targets, e.g. unit tests
    #[cfg(not(target_family = "wasm"))]
    {
        0
    }
}

fn with_rng<T>(cb: impl FnOnce(&mut Rng) -> T) -> T {
    RNG.with_borrow_mut(cb)
}

pub fn with_random_bytes<const N: usize, T>(cb: impl FnOnce([u8; N]) -> T) -> T {
    with_rng(|rng| {
        let mut bytes = [0u8; N];
        rng.fill(&mut bytes);

        cb(bytes)
    })
}
