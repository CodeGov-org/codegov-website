import {
  Component,
  ComponentInterface,
  Event,
  EventEmitter,
  Host,
  State,
  h,
} from '@stencil/core';

export interface ImageMetadata {
  url: string;
  size: number;
  width: number;
  height: number;
}

export interface ImageSet {
  sm: ImageMetadata;
  md: ImageMetadata;
  lg: ImageMetadata;
  xl: ImageMetadata;
  xxl: ImageMetadata;
}

const SM_IMAGE_WIDTH = 640;
const MD_IMAGE_WIDTH = 1024;
const LG_IMAGE_WIDTH = 1280;
const XL_IMAGE_WIDTH = 1536;
const XXL_IMAGE_WIDTH = 1920;

const MAX_IMAGE_SIZE = 200 * 1024; // 200kb
const IMAGE_TYPE = 'image/jpeg';
const IMAGE_QUALITY = 0.8;

@Component({
  tag: 'cg-image-uploader-btn',
  scoped: true,
})
export class ImageUploaderBtnComponent implements ComponentInterface {
  @Event()
  public imagesSelected!: EventEmitter<ImageSet[]>;

  @State()
  private images: ImageSet[] = [];
  private fileInputElem!: HTMLInputElement;

  public render() {
    return (
      <Host>
        <input
          type="file"
          multiple
          hidden
          accept="image/*"
          ref={elem => this.setFileInputElem(elem)}
          onChange={() => this.onFileInputChanged()}
        />

        <cg-text-btn onClick={() => this.onSelectImagesBtnClicked()}>
          <slot />
        </cg-text-btn>
      </Host>
    );
  }

  public disconnectedCallback(): void {
    this.revokeImages();
  }

  private setFileInputElem(elem?: HTMLInputElement): void {
    if (!elem) {
      throw new Error('Input element not found');
    }

    this.fileInputElem = elem;
  }

  private onSelectImagesBtnClicked(): void {
    this.fileInputElem.click();
  }

  private async onFileInputChanged(): Promise<void> {
    if (!this.fileInputElem.files) {
      return;
    }

    await this.handleFileChange(this.fileInputElem.files);
    this.fileInputElem.value = '';
  }

  private async handleFileChange(files: FileList): Promise<void> {
    this.revokeImages();

    for (let i = 0; i < files.length; i++) {
      const image = await getImageSetFromFile(files[i]);

      this.images = [...this.images, image];
    }

    this.imagesSelected.emit(this.images);
  }

  private revokeImages(): void {
    this.images.forEach(image => {
      URL.revokeObjectURL(image.sm.url);
      URL.revokeObjectURL(image.md.url);
      URL.revokeObjectURL(image.lg.url);
      URL.revokeObjectURL(image.xl.url);
      URL.revokeObjectURL(image.xxl.url);
    });
    this.images = [];
  }
}

async function getImageSetFromFile(blob: Blob): Promise<ImageSet> {
  const dataUrl = URL.createObjectURL(blob);

  const [sm, md, lg, xl, xxl] = await Promise.all([
    await getImageMetadata(dataUrl, SM_IMAGE_WIDTH),
    await getImageMetadata(dataUrl, MD_IMAGE_WIDTH),
    await getImageMetadata(dataUrl, LG_IMAGE_WIDTH),
    await getImageMetadata(dataUrl, XL_IMAGE_WIDTH),
    await getImageMetadata(dataUrl, XXL_IMAGE_WIDTH),
  ]);

  URL.revokeObjectURL(dataUrl);

  return {
    sm,
    md,
    lg,
    xl,
    xxl,
  };
}

async function getImageMetadata(
  dataUrl: string,
  maxWidth: number,
): Promise<ImageMetadata> {
  const resizedBlob = await resizeImageDataUrl(dataUrl, maxWidth);
  const resizedDataUrl = URL.createObjectURL(resizedBlob);
  const resizedImageElem = await imageElemFromDataUrl(resizedDataUrl);

  return {
    url: resizedDataUrl,
    size: resizedBlob.size,
    width: resizedImageElem.width,
    height: resizedImageElem.height,
  };
}

async function imageElemFromDataUrl(
  dataUrl: string,
): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    const image = new Image();
    image.src = dataUrl;
    image.onload = () => {
      resolve(image);
    };
  });
}

async function resizeImageDataUrl(
  dataUrl: string,
  maxWidth: number,
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    const img = new Image();
    img.src = dataUrl;

    img.onload = async function () {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) {
        return reject('Could not get canvas context');
      }

      const [newWidth, newHeight] = recalculateImageDimensions(
        img.width,
        img.height,
        maxWidth,
      );

      canvas.width = newWidth;
      canvas.height = newHeight;

      context.drawImage(img, 0, 0, newWidth, newHeight);

      let targetQuality = IMAGE_QUALITY;
      let blob = await canvasToBlob(canvas, IMAGE_TYPE, IMAGE_QUALITY);
      while (blob.size > MAX_IMAGE_SIZE) {
        targetQuality -= 0.1;
        blob = await canvasToBlob(canvas, IMAGE_TYPE, targetQuality);
      }

      resolve(blob);
    };
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  imageType: string,
  imageQuality: number,
): Promise<Blob> {
  return new Promise(resolve => {
    canvas.toBlob(
      blob => {
        if (!blob) {
          throw new Error('Could not create blob');
        }

        resolve(blob);
      },
      imageType,
      imageQuality,
    );
  });
}

function recalculateImageDimensions(
  width: number,
  height: number,
  maxWidth: number,
): [number, number] {
  let newWidth = width;
  let newHeight = height;

  const aspectRatio = width / height;

  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }

  return [newWidth, newHeight];
}
