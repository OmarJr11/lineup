import { FilesController } from './files.controller';
import { FilesService } from '../../../../core/modules/files/files.service';
import { filesResponses } from '../../../../core/common/responses';
import type {
  IBusinessReq,
  IFileInterface,
  IUserReq,
} from '../../../../core/common/interfaces';
import type { UploadFileDto } from '../../../../core/modules/files/dto/upload-file.dto';

/**
 * Unit tests for {@link FilesController} (businesses app).
 */
describe('FilesController (businesses)', () => {
  let controller: FilesController;
  const filesServiceMock = {
    uploadFile: jest.fn(),
    uploadDocumentFile: jest.fn(),
  };
  const user: IUserReq = { userId: 2, username: 'staff' };
  const businessReq: IBusinessReq = { path: '/b', businessId: 8 };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FilesController(
      filesServiceMock as unknown as FilesService,
    );
  });

  describe('uploadFile', () => {
    it('returns success payload with uploaded file', async () => {
      const uploaded = { id: 20 };
      filesServiceMock.uploadFile.mockResolvedValue(uploaded);
      const result = await controller.uploadFile(
        {} as IFileInterface,
        {} as UploadFileDto,
        user,
      );
      expect(result).toEqual({
        ...filesResponses.upload.success,
        file: uploaded,
      });
    });
  });

  describe('uploadDocument', () => {
    it('uploads document and returns success without file wrapper', async () => {
      filesServiceMock.uploadDocumentFile.mockResolvedValue(undefined);
      const result = await controller.uploadDocument(
        {} as IFileInterface,
        businessReq,
      );
      expect(filesServiceMock.uploadDocumentFile).toHaveBeenCalledWith(
        {} as IFileInterface,
        businessReq,
      );
      expect(result).toEqual(filesResponses.upload.success);
    });
  });
});
