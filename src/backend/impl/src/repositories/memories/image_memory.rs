use ic_stable_structures::BTreeMap;

use crate::repositories::{Image, ImageId};

use super::{Memory, IMAGES_MEMORY_ID, MEMORY_MANAGER};

pub type ImageMemory = BTreeMap<ImageId, Image, Memory>;

pub fn init_images() -> ImageMemory {
    ImageMemory::init(get_images_memory())
}

fn get_images_memory() -> Memory {
    MEMORY_MANAGER.with(|m| m.borrow().get(IMAGES_MEMORY_ID))
}
