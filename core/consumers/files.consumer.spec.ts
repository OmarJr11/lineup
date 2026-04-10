import { Job } from 'bullmq';
import { FilesConsumer } from './files.consumer';
import { FilesImportsService } from '../modules/files/files-imports.service';
import { FilesSettersService } from '../modules/files/files-setters.service';
import { ProductsSettersService } from '../modules/products/products-setters.service';
import { FilesConsumerEnum } from '../common/enums/consumers';
import { StatusEnum } from '../common/enums';
import type { IBusinessReq } from '../common/interfaces';

/**
 * Unit tests for {@link FilesConsumer}.
 */
describe('FilesConsumer', () => {
  let consumer: FilesConsumer;
  const filesImportsServiceMock = {
    uploadDocumentFile: jest.fn(),
  };
  const filesSettersServiceMock = {
    generateThumbnailsForImage: jest.fn(),
  };
  const productsSettersServiceMock = {
    create: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new FilesConsumer(
      filesImportsServiceMock as unknown as FilesImportsService,
      filesSettersServiceMock as unknown as FilesSettersService,
      productsSettersServiceMock as unknown as ProductsSettersService,
    );
  });

  it('generateThumbnails skips when payload incomplete', async () => {
    const job = {
      id: '1',
      name: FilesConsumerEnum.GenerateThumbnails,
      data: { fileName: 'a.png' },
    } as Job;
    await consumer.process(job);
    expect(
      filesSettersServiceMock.generateThumbnailsForImage,
    ).not.toHaveBeenCalled();
  });

  it('generateThumbnails calls FilesSettersService', async () => {
    const payload = {
      fileName: 'a.png',
      directory: '/tmp',
      mimetype: 'image/png',
    };
    const job = {
      id: '2',
      name: FilesConsumerEnum.GenerateThumbnails,
      data: payload,
    } as Job;
    await consumer.process(job);
    expect(
      filesSettersServiceMock.generateThumbnailsForImage,
    ).toHaveBeenCalledWith(payload);
  });

  it('uploadDocumentFile creates pending products from import', async () => {
    const businessReq = { businessId: 3, path: '' } as IBusinessReq;
    filesImportsServiceMock.uploadDocumentFile.mockResolvedValue([
      { title: 'P1' },
    ]);
    productsSettersServiceMock.create.mockResolvedValue(undefined);
    const buf = Buffer.from('x');
    const job = {
      id: '3',
      name: FilesConsumerEnum.UploadDocumentFile,
      data: {
        fieldname: 'f',
        originalname: 'doc.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: 1,
        bufferBase64: buf.toString('base64'),
        businessReq,
      },
    } as Job;
    await consumer.process(job);
    expect(filesImportsServiceMock.uploadDocumentFile).toHaveBeenCalled();
    expect(productsSettersServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'P1',
        status: StatusEnum.PENDING,
        idCatalog: null,
      }),
      businessReq,
    );
  });
});
