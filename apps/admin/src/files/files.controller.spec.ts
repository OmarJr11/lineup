import { FilesController } from './files.controller';
import { FilesService } from '../../../../core/modules/files/files.service';
import { filesResponses } from '../../../../core/common/responses';
import type { IFileInterface } from '../../../../core/common/interfaces';
import type { IUserReq } from '../../../../core/common/interfaces';
import type { UploadFileDto } from '../../../../core/modules/files/dto/upload-file.dto';

/**
 * Unit tests for {@link FilesController} (admin app).
 */
describe('FilesController (admin)', () => {
  let controller: FilesController;
  const filesServiceMock = {
    uploadFile: jest.fn(),
  };
  const user: IUserReq = { userId: 1, username: 'admin' };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FilesController(
      filesServiceMock as unknown as FilesService,
    );
  });

  describe('uploadFile', () => {
    it('returns success payload with uploaded file', async () => {
      const uploaded = { id: 30 };
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
});
